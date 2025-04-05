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
	 * The Durable Object exposes an RPC method sayHello which will be invoked when when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param {string} name - The name provided to a Durable Object instance from a Worker
	 * @returns {Promise<string>} The greeting to be sent back to the Worker
	 */
	async sayHello(name) {
		return `Hello, ${name}!`;
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
  switch (this) {
    case '/cf': { // {{{2
      request.cf ??= { error: "The `cf` object is not available." };
      return new Response(JSON.stringify(request.cf, null, 2), {
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
      });
    }
    //case '/favicon.ico': // {{{2
      //return new Response('OK', /*favicon,*/ { headers: { 'content-type': 'image/x-icon' } });
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
      let id = env.KOT_DO.idFromName(this);

      let stub = env.KOT_DO.get(id);
      // This stub creates a communication channel with the Durable Object instance
      // The Durable Object constructor will be invoked upon the first call for a given id
      // We call the `sayHello()` RPC method on the stub to invoke the method on the remote
      // Durable Object instance
      return stub.sayHello("Kloud Of Trust").then(greeting => new Response(greeting));
    }
    case '/style.css': // {{{2
      return new Response(style, { headers: { 'content-type': 'text/css' } });
    case '/template': // {{{2
      return new Response(
        template.replace('IPADDRESS', request.headers.get('CF-Connecting-IP')).
          replace('DATETIME', new Date().toISOString()),
        { headers: { 'content-type': 'text/html;charset=UTF-8' } });
    default: // {{{2
      return new Response('Not Found', { status: 404 }); // }}}2
  }
}
