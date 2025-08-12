import { DurableObject } from "cloudflare:workers"; // {{{1
import { DOpad, IpState, JobFair, Page, } from './util.js'

import style from '../public/static/style.css'
import dopad from '../public/dopad.html'
import hx from '../public/hx.html'
import sandbox from '../public/sandbox.html'
import template from '../public/template.html'
Page.use({ style, dopad, hx, sandbox, template, })

export class KoT_Do extends DurableObject { // {{{1
	constructor(ctx, env) { // {{{2
		super(ctx, env);
	}
  async delete (key) { // {{{2
    let value = await this.ctx.storage.delete(key)
    console.log('delete', key, value)
    return value
  }
  async deleteAll () { // {{{2
    let value = await this.ctx.storage.deleteAll()
    console.log('deleteAll', value)
    return value
  }
  fetch(request) { // {{{2
    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)
    this.ctx.acceptWebSocket(server)
    try {
      JobFair.dispatch.call(this, request, server)
      return new Response(null, { status: 101, webSocket: client });
    } catch (err) {
      server.close()
      return new Response(err.message, { status: 401 });
    }
  }
  async get (key) { // {{{2
    let value = await this.ctx.storage.get(key)
    console.log('get', key, value)
    return value
  }
	async homepage(name, ip) { // {{{2
    let ipState = await this.get('IPs'); ipState ??= []
    IpState.use(ipState)
    IpState.set(ip, 'homepage', true)
    await this.put('IPs', IpState.ips)
		return `${name}`;
	}
  async list () { // {{{2
    let value = await this.ctx.storage.list()
    console.log('list', value)
    return value
  }
  async put (key, value) { // {{{2
    console.log('put', key, value)
    await this.ctx.storage.put(key, value)
    return true;
  }
  async webSocketClose(ws, code, reason, wasClean) { // {{{2
    JobFair.wsClose(ws, code, reason, wasClean)
  }
  async webSocketMessage(ws, message) { // {{{2
    //console.log('webSocketMessage message', message, 'websockets', this.ctx.getWebSockets())
    JobFair.wsDispatch(message, ws)
  } // }}}2
}

export default { // {{{1
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param {Request} request - The request submitted to the Worker from the client
	 * @param {Env} env - The interface to reference bindings declared in wrangler.jsonc
	 * @param {ExecutionContext} ctx - The execution context of the Worker
	 * @returns {Promise<Response>} The response to be sent back to the client
	 */
	async fetch(request, env, ctx) {
    env.KOT_DO_ID ??= env.KOT_DO.idFromName('/kot_do')
    env.KOT_DO_WSH_ID ??= env.KOT_DO.idFromName('/JobFair webSocket with Hibernation')
    let pathname = new URL(request.url).pathname
    switch (true) {
      case pathname.startsWith('/hack'):
      case pathname.startsWith('/jag'):
      case pathname.startsWith('/jcl'):
      case pathname.startsWith('/job'):
        return JobFair.dispatch(request, env, ctx);
      default:
        return await dispatch.call(pathname, request, env, ctx);
    }
	},
};

async function dispatch (request, env, ctx) { // {{{1
  let ip = request.headers.get('CF-Connecting-IP');
  let page = new Page(this, env)
  let stub = env.KOT_DO.get(env.KOT_DO_ID)

  let content = { // {{{2
    IPADDRESS: ip, 
    DATETIME: new Date().toISOString(),
    LATITUDE: request.cf.latitude,
    LONGITUDE: request.cf.longitude,
  } // }}}2

  switch (true) {
    case this == '/cf': // {{{2
      request.cf ??= { error: "The `cf` object is not available." };
      return new Response(JSON.stringify(request.cf, null, 2), {
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
      });
    case /\/dopad/.test(this): { // {{{2
      let page = new Page('/dopad', env) // TODO remove duplicate?
      content.DOTOTALS = replaceDOTOTALS.call(page, env)
      return new DOpad(page).serve(new URL(request.url)).then(text => {
        content.DODETAILS = text
        return new Response(page.set(content), { headers: { 'content-type': 'text/html;charset=UTF-8' } })
      });
    }
    case this == '/hx': { // {{{2
      let vars = ['hx_STELLAR_NETWORK', 'hx_testnet_IssuerPK']
      return new Response(page.set(content, vars), { headers: { 'content-type': 'text/html;charset=UTF-8' } });
    }
    case this == '/ip': // {{{2
      return new Response(JSON.stringify({ ip }, null, 2), {
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
      });
    case this == '/kot_do': // {{{2
      return stub.homepage("Kloud Of Trust", ip).then(greeting => new Response(greeting));
    case this == '/style.css': // {{{2
      return new Response(style, { headers: { 'content-type': 'text/css' } });
    case this == '/sandbox': // {{{2
      return new Response(page.set(content),
        { headers: { 'content-type': 'text/html;charset=UTF-8' } });
    case this == '/template': // {{{2
      return stub.get('IPs').then(ipState => IpState.use(ipState) && IpState.get(ip, 'homepage') ?
        IpState.set(ip, 'homepage', false) && stub.put('IPs', IpState.ips) && new Response(
          page.set(content),
          { headers: { 'content-type': 'text/html;charset=UTF-8' } }) :
        new Response('Please reload the home page of this site.')
      );
    default: // {{{2
      return new Response('Not Found', { status: 404 }); // }}}2
  }
}
function replaceDOTOTALS (env) { // TODO store DO ids in a KV pair {{{1
  this.data.DOs = [[env.KOT_DO_ID, env.KOT_DO.get(env.KOT_DO_ID)], [env.KOT_DO_WSH_ID, env.KOT_DO.get(env.KOT_DO_WSH_ID)]] // 2 DOs
  let pattern = 'DOTOTALS'
  return pattern.replace(pattern, `2 DOs with ids <b>${env.KOT_DO_ID.name}, ${env.KOT_DO_WSH_ID.name}</b>`)
}
