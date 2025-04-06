import { DurableObject } from "cloudflare:workers"; // {{{1
import style from '../public/static/style.css'
import template from '../public/template.html'

/**
 * Env provides a mechanism to reference bindings declared in wrangler.jsonc within JavaScript
 *
 * @typedef {Object} Env
 * @property {DurableObjectNamespace} KOT_DO - The Durable Object namespace binding
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class KoT_Do extends DurableObject {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param {DurableObjectState} ctx - The interface for interacting with Durable Object state
	 * @param {Env} env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx, env) {
		super(ctx, env);
	}

	/**
	 * The Durable Object exposes an RPC method homepage which will be invoked when when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param {string} name - The name provided to a Durable Object instance from a Worker
	 * @returns {Promise<string>} The greeting to be sent back to the Worker
	 */
  async get (key) {
    let value = await this.ctx.storage.get(key)
    console.log('get', key, value)
    return value
  }
	async homepage(name, ip) {
    let ipState = await this.get('IP')
    ipState ??= {}
    ipState.homepage = true
    await this.put('IP', ipState)
		return `Hello, ${name}!`;
	}
  async put (key, value) {
    console.log('put', key, value)
    await this.ctx.storage.put(key, value)
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
  let stub = id ? env.KOT_DO.get(id) : null
  switch (this) {
    case '/cf': { // {{{2
      request.cf ??= { error: "The `cf` object is not available." };
      return new Response(JSON.stringify(request.cf, null, 2), {
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
      });
    }
    case '/ip': { // {{{2
      return new Response(JSON.stringify({ ip: request.headers.get('CF-Connecting-IP') }, null, 2), {
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
      });
    }
    case '/kot_do': { // {{{2
      // We will create a `DurableObjectId` using the pathname from the Worker request
      // This id refers to a unique instance of our 'KoT_Do' class above
      let id = env.KOT_DO.idFromName(this); env.KOT_DO_ID = id
      let ip = request.headers.get('CF-Connecting-IP');
      stub = env.KOT_DO.get(id)
      return stub.homepage("Kloud Of Trust", ip).then(greeting => new Response(greeting));
    }
    case '/style.css': // {{{2
      return new Response(style, { headers: { 'content-type': 'text/css' } });
    case '/template': // {{{2
      let ip = request.headers.get('CF-Connecting-IP');
      return stub.get('IP').then(ipState => ipState.homepage ? new Response(
          template.replace('IPADDRESS', ip).replace('DATETIME', new Date().toISOString()),
          { headers: { 'content-type': 'text/html;charset=UTF-8' } }) :
        new Response('OK')
      );
    default: // {{{2
      return new Response('Not Found', { status: 404 }); // }}}2
  }
}
