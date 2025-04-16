import { DurableObject } from "cloudflare:workers"; // {{{1
import { DataCurator, IpState, Page, } from '../lib/util.js'

import style from '../public/static/style.css'
import datacurator from '../public/datacurator.html'
import sandbox from '../public/sandbox.html'
import template from '../public/template.html'
Page.use({ style, datacurator, sandbox, template, })

export class KoT_Do extends DurableObject { // {{{1
	constructor(ctx, env) {
		super(ctx, env);
	}
  async get (key) {
    let value = await this.ctx.storage.get(key)
    console.log('get', key, value)
    return value
  }
	async homepage(name, ip) {
    let ipState = await this.get('IPs')
    IpState.use(ipState)
    IpState.set(ip, 'homepage', true)
    await this.put('IPs', IpState.ips)
		return `${name}`;
	}
  async list () {
    let value = await this.ctx.storage.list()
    console.log('list', value)
    return value
  }
  async put (key, value) {
    console.log('put', key, value)
    await this.ctx.storage.put(key, value)
    return true;
  }
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
    let pathname = new URL(request.url).pathname;
    return await dispatch.call(pathname, request, env, ctx);
	},
};

function dispatch (request, env, ctx) { // {{{1
  let id = env.KOT_DO_ID
  let ip = request.headers.get('CF-Connecting-IP');
  let page = new Page(this, env)
  let stub = id ? env.KOT_DO.get(id) : null

  let content = { // {{{2
    IPADDRESS: ip, 
    DATETIME: new Date().toISOString()} // }}}2

  switch (this) {
    case '/cf': // {{{2
      request.cf ??= { error: "The `cf` object is not available." };
      return new Response(JSON.stringify(request.cf, null, 2), {
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
      });
    case '/datacurator': // {{{2
      content.KVDOTOTALS = replaceKVDOTOTALS.call(page, env)
      {
        let dc = new DataCurator(page)
        content.KVDETAILS = dc.ppKVs()
        return dc.ppDOs().then(text => {
          content.DODETAILS = text
          return new Response(page.set(content),
            { headers: { 'content-type': 'text/html;charset=UTF-8' } })
        })
      }
    case '/ip': // {{{2
      return new Response(JSON.stringify({ ip }, null, 2), {
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
      });
    case '/kot_do': // {{{2
      // We will create a `DurableObjectId` using the pathname from the Worker request
      // This id refers to a unique instance of our 'KoT_Do' class above
      id = env.KOT_DO.idFromName(this); env.KOT_DO_ID = id
      stub = env.KOT_DO.get(id)
      return stub.homepage("Kloud Of Trust", ip).then(greeting => new Response(greeting));
    case '/style.css': // {{{2
      return new Response(style, { headers: { 'content-type': 'text/css' } });
    case '/sandbox': // {{{2
      return new Response(page.set(content),
        { headers: { 'content-type': 'text/html;charset=UTF-8' } });
    case '/template': // {{{2
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
function replaceKVDOTOTALS (env) { // {{{1
  this.data.KVs = [] // no KVs
  this.data.DOs = [[env.KOT_DO_ID, env.KOT_DO.get(env.KOT_DO_ID)]] // 1 DO
  let pattern = 'KVDOTOTALS'
  return pattern.replace(pattern, `no KVs and 1 DO with id <b>${env.KOT_DO_ID.name}</b>`)
}
