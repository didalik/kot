import { DurableObject } from "cloudflare:workers"; // {{{1
import { DOpad, IpState, JobFair, Page, log_method_and_url, } from './util.js'

import style from '../public/static/style.css'
import dopad from '../public/dopad.html'
import sandbox from '../public/sandbox.html'
import template from '../public/template.html'
Page.use({ style, dopad, sandbox, template, })

export class KoT_Do extends DurableObject { // {{{1
	constructor(ctx, env) { // {{{2
		super(ctx, env);
	}
  async delete (key) { // {{{2
    let value = await this.ctx.storage.delete(key)
    console.log('delete', key, value)
    return value
  }
  async fetch(request) { // {{{2
    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)
    this.ctx.acceptWebSocket(server, ['tag1', 'tag2', 'tag3'])
    return new Response(null, { status: 101, webSocket: client });
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
    console.log('webSocketClose ws', ws, 'code', code, 'reason', reason, 'wasClean', wasClean)
    wasClean && ws.close()
  }
  async webSocketMessage(ws, message) { // {{{2
    console.log('webSocketMessage message', message, 'open', this.ctx.getWebSockets())
    this.get('JOB_AGENT_ID').then(v => ws.send(v))
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
    let [method, url] = log_method_and_url('fetch', request, false)
    switch (true) {
      case url.pathname.startsWith('/jcl'):
      case url.pathname.startsWith('/job'):
      case url.pathname.startsWith('/jag'):
        return await new JobFair().add(request, env, ctx);
      default:
        return await dispatch.call(url.pathname, request, env, ctx);
    }
	},
};

async function dispatch (request, env, ctx) { // {{{1
  let id = env.KOT_DO_ID
  let ip = request.headers.get('CF-Connecting-IP');
  let page = new Page(this, env)
  let stub = id ? env.KOT_DO.get(id) : null
  console.log('dispatch stub', stub)

  let content = { // {{{2
    IPADDRESS: ip, 
    DATETIME: new Date().toISOString()} // }}}2

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
    case this == '/ip': // {{{2
      return new Response(JSON.stringify({ ip }, null, 2), {
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
      });
    case this == '/kot_do': // {{{2
      // We will create a `DurableObjectId` using the pathname from the Worker request
      // This id refers to a unique instance of our 'KoT_Do' class above
      id = env.KOT_DO.idFromName(this); env.KOT_DO_ID = id
      stub = env.KOT_DO.get(id)
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
  this.data.DOs = [[env.KOT_DO_ID, env.KOT_DO.get(env.KOT_DO_ID)]] // 1 DO
  let pattern = 'DOTOTALS'
  return pattern.replace(pattern, `1 DO with id <b>${env.KOT_DO_ID.name}</b>`)
}
