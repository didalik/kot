/* Copyright (c) 2024-present, Дід Alik and the Kids {{{1
 *
 * This script is licensed under the Apache License, Version 2.0, found in the
 * LICENSE file in the root directory of this source tree.
 * * */

const algorithm = { name: "Ed25519", } // {{{1
const base64ToUint8 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
const uint8ToBase64 = (arr) => Buffer.from(arr).toString('base64')
// HUGE thanks to:
// - https://1loc.dev/string/convert-an-uint8-array-to-a-base64-encoded-string/

const kv = (e, k) => e.spa ? e[k] : e[window.argv[3] + '_' + k] // {{{1

class Semaphore { // {{{1
  // Source: {{{2
  // https://github.com/jsoendermann/semaphore-async-await

  #permits // {{{2
  #promiseResolverQueue

  constructor (permits) { // {{{2
    this.#permits = permits
    this.#promiseResolverQueue = []
  }

  acquire () { // {{{2
    return this.wait();
  }

  /** drainPermits {{{2
   * Acquires all permits that are currently available and returns the number 
   * of acquired permits.
   * @returns  Number of acquired permits.
   */
  drainPermits () {
    if (this.#permits > 0) {
      const permitCount = this.#permits;
      this.#permits = 0;
      return permitCount;
    }

    return 0;
  }

  /** async execute {{{2
   * Schedules func to be called once a permit becomes available.
   * Returns a promise that resolves to the return value of func.
   * @param func  The function to be executed.
   * @return  A promise that gets resolved with the return value of the function.
   */
  async execute (func) {

    //console.log(this.#promiseResolverQueue.length, this.#permits, func)

    await this.wait();
    try {
      return await func();
    } catch(e) {
      console.error(e)
      alert(e)
    } finally {

      //console.log(this.#promiseResolverQueue.length, this.#permits, 'DONE', func)

      this.signal();
    }
  }

  getPermits () { // {{{2
    return this.#permits;
  }

  /** release {{{2
   * Alias for this.signal.
   */
  release () {
    //console.log('Semaphore.release'); console.trace()

    this.signal();
    return true;
  }

  /** signal {{{2
   * Increases the number of permits by one. If there are other functions waiting, 
   * one of them will continue to execute in a future iteration of the event loop.
   */
  signal () {
    this.#permits += 1;

    if (this.#permits > 1 && this.#promiseResolverQueue.length > 0) {
      throw new Error(
        'Semaphore.permits should never be > 0 when there is someone waiting.'
      );
    } else if (this.#permits === 1 && this.#promiseResolverQueue.length > 0) {
      // If there is someone else waiting, immediately consume the permit that was 
      // released at the beginning of this function and let the waiting function 
      // resume.
      this.#permits -= 1;

      const nextResolver = this.#promiseResolverQueue.shift();
      if (nextResolver) {
        nextResolver(true);
      }
    }
  }

  toJso () { // {{{2
    return { agents: this.#permits, users: this.#promiseResolverQueue.length };
  }

  /** tryAcquire {{{2
   * Synchronous function that tries to acquire a permit and returns 
   * true if successful, false otherwise.
   * @returns  Whether a permit could be acquired.
   */
  tryAcquire () {
    if (this.#permits > 0) {
      this.#permits -= 1;
      return true;
    }

    return false;
  }

  wait () { // {{{2
    if (this.#permits > 0) {
      this.#permits -= 1;
      return Promise.resolve(true);
    }

    // If there is no permit available, we return a promise that resolves 
    // once the semaphore gets signaled enough times that permits is equal to one.
    return new Promise(resolver => this.#promiseResolverQueue.push(resolver));
  }

  /** async waitFor {{{2
   * Same as this.wait except the promise returned gets resolved with false if no
   * permit becomes available in time.
   * @param milliseconds  The time spent waiting before the wait is aborted. 
   * This is a lower bound, you shouldn't rely on it being precise.
   * @returns  A promise that gets resolved to true when execution is allowed to 
   * proceed or false if the time given elapses before a permit becomes available.
   */
  async waitFor (milliseconds) {
    if (this.#permits > 0) {
      this.#permits -= 1;
      return Promise.resolve(true);
    }

    // We save the resolver function in the current scope so that we can 
    // resolve the promise to false if the time expires. TODO use reject instead?
    let resolver
    const promise = new Promise(r => { resolver = r })

    // The saved resolver gets added to our list of promise resolvers so that it gets
    // a chance to be resolved as a result of a call to signal().
    this.#promiseResolverQueue.push(resolver);

    setTimeout(() => {
      // We have to remove the promise resolver from our list. Resolving it twice 
      // would not be an issue but signal() always takes the next resolver from the
      // queue and resolves it which would swallow a permit if we didn't remove it.
      const index = this.#promiseResolverQueue.indexOf(resolver);
      if (index !== -1) {
        this.#promiseResolverQueue.splice(index, 1);
      } else {
        // This shouldn't happen, not much we can do at this point
        throw new Error(
          `Semaphore.waitFor couldn't find its promise resolver in the queue`
        );
      }

      // Resolve to false because the wait was unsuccessful.
      resolver(false);
    }, milliseconds);

    return promise;
  }

  // }}}2
}

async function USER_URL (data2sign, remoteStr, e) { // {{{1
  let [privateKey, publicKey, host, noget] = await pGET_parms.call(this, remoteStr, 'noget', 'USER', e)
  let actorPK = encodeURIComponent(e.USER_PK)
  let text = await pGET.call(this,
    '/svc/user_url_stub/' + e.actorId, 
    `?actorPK=${actorPK}`,
    { data2sign, privateKey, publicKey }, host, noget
  )
  return text;
}

async function WS_USER_URL (data2sign, remoteStr, e) { // {{{1
  let [privateKey, publicKey, host, noget] = await pGET_parms.call(this, remoteStr, 'noget', 'USER', e)
  let actorPK = encodeURIComponent(e.USER_PK)
  let SVC_PK = encodeURIComponent(e.SVC_PK)
  let text = await pGET.call(this,
    '/ws/user/' + e.actorId, 
    `?actorPK=${actorPK}&SVC_PK=${SVC_PK}`,
    { data2sign, privateKey, publicKey }, host, noget
  )
  return text.replace('http', 'ws');
}

function addLine (content, suffix) { // {{{1
  content.appendChild(document.createTextNode(suffix))
  content.appendChild(document.createElement('br'))
}

function b64_to_utf8( str ) { // {{{1
  return decodeURIComponent(escape(atob( str )));
}

async function generate_keypair () { // {{{1
  const keypair = await this.generateKey(algorithm, true, ['sign', 'verify'])
  let pk = await this.exportKey('raw', keypair.publicKey)
  let sk = await this.exportKey('jwk', keypair.privateKey)
  pk = uint8ToBase64(new Uint8Array(pk))
  sk = JSON.stringify(sk)
  //console.error('generate_keypair sk', sk, 'pk', pk)
  return Promise.resolve(`${sk} ${pk}`);
}

async function pGET ( // {{{1
  path = '', 
  parms = '', 
  keypair = null,
  host = window.CFW_URL_DEV,
  noget = false
) {
  keypair ??= await this.generateKey(algorithm, true, ['sign', 'verify'])
  let [b64data, b64signature] = await sign.call(this, keypair)
  let eb64d = encodeURIComponent(b64data), eb64s = encodeURIComponent(b64signature)
  let parmsTail = `eb64d=${eb64d}&eb64s=${eb64s}`
  parms = parms.length == 0 ? `?${parmsTail}` : parms + `&${parmsTail}`

  if (noget) {
    return `${host}${path}${parms}`;
  }
  return fetch(`${host}${path}${parms}`, { method: 'GET', })
    .then(async response => {
      if (response.ok) {
        return await response.text(); // TODO is await needed here?
      }
      let text
      try {
        text = await response.text()
      } catch(e) {
        console.error(e)
        throw new Error(response.status)
      }
      console.error('- pGET ERROR', response.status, text)
      return response.status;
    });
}

async function pGET_parms (remote, noget, role = 'OWNER', e = process.env) { // {{{1
  //console.log('- pGET_parms role', role, 'window.argv', window.argv, 'e', e)
  let a = base64ToUint8(kv(e, role + '_PK'))
  let publicKey = await this.importKey('raw', a.buffer, algorithm, true, ['verify'])
  a = JSON.parse(kv(e, role + '_SK'))
  let privateKey = await this.importKey('jwk', a, algorithm, true, ['sign'])
  let host = remote == 'remote' ? `https://${e.SVC_NAME}.didalik.workers.dev`
  : `http://${e.HOST_SVC ?? '127.0.0.1'}:${e.PORT_SVC ?? e['PORT_' + e.SVC_NAME] ?? 8787}`
  noget = noget == 'noget';
  return [privateKey, publicKey, host, noget];
}

function retrieveItem (itemName) { // {{{1
  if (!storageAvailable('localStorage')) {
    throw 'localStorage NOT available'
  }
  let item = localStorage.getItem(itemName)
  return item ? JSON.parse(b64_to_utf8(item))[itemName] : undefined;
}

async function sign (kp) { // {{{1
  let pk = await this.exportKey('raw', kp.publicKey)
  kp.data2sign = kp?.data2sign.toString() ?? pk
  const b64data = uint8ToBase64(kp.data2sign)
  const signature = await this.sign(algorithm, kp.privateKey, new TextEncoder().encode(b64data))
  return [b64data, uint8ToBase64(new Uint8Array(signature))];
}

let signedData = data => base64ToUint8(data).toString().split(',').reduce((s, c) => s + String.fromCodePoint(c), '') // {{{1

function storageAvailable(type) { // {{{1
    var storage;
    try {
        storage = window[type];
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
}

function storeItem (itemName, item) { // {{{1
  if (!storageAvailable('localStorage')) {
    throw 'localStorage NOT available'
  }
  let itemWrap = {}
  itemWrap[itemName] = item
  localStorage.setItem(itemName, utf8_to_b64(JSON.stringify(itemWrap)))
}

function utf8_to_b64( str ) { // {{{1
  return btoa(unescape(encodeURIComponent( str )));
}

async function verifyData (data, signer, signature) { // {{{1
  //console.log('- verifyData signer', signer, 'signature', signature)
  let a = base64ToUint8(signer)
  signature = base64ToUint8(signature)

  const importedPK = await this.importKey('raw', a.buffer, algorithm, true, ['verify'])
  return await this.verify(algorithm, importedPK, signature, new TextEncoder().encode(data));
}

export { // {{{1
  Semaphore, USER_URL, WS_USER_URL, addLine,
  algorithm, base64ToUint8, generate_keypair,
  kv, pGET,  pGET_parms, retrieveItem, sign, signedData, storeItem,
  uint8ToBase64, verifyData,
}
