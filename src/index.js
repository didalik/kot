import { DurableObject } from "cloudflare:workers"; // {{{1
import { DOpad, IpState, Page, } from '../lib/util.js'

import style from '../public/static/style.css'
import dopad from '../public/dopad.html'
import sandbox from '../public/sandbox.html'
import template from '../public/template.html'
Page.use({ style, dopad, sandbox, template, })

export class KoT_Do extends DurableObject { // {{{1
	constructor(ctx, env) {
		super(ctx, env);
	}
  async delete (key) {
    let value = await this.ctx.storage.delete(key)
    console.log('delete', key, value)
    return value
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
    let url = new URL(request.url)
    console.log('fetch request.url:', url)
    let pathname = url.pathname;
    return await dispatch.call(pathname, request, env, ctx);
	},
};

async function dispatch (request, env, ctx) { // {{{1
  let id = env.KOT_DO_ID
  let ip = request.headers.get('CF-Connecting-IP');
  let page = new Page(this, env)
  let stub = id ? env.KOT_DO.get(id) : null

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
