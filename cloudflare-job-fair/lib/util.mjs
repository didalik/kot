import fetch from 'node-fetch' // // CLIENT {{{1
import WebSocket from 'ws'
import { base64ToUint8, generate_keypair, uint8ToBase64, } from '../../public/lib/util.mjs'

const configuration = {} // CLIENT {{{1

async function hack (node, run, cmd, ...args) { // CLIENT {{{1
  let path = hackURLpath(args)
  let urlHack = process.env._ == 'bin/dev.mjs' ? 'http://127.0.0.1:8787/hack'
    : 'https://jag.kloudoftrust.org/hack'
  let url = `${urlHack}${path}`
  log('- hack args', args, 'url', url, 'configuration', configuration)
  /*
  wsConnect(url)
  */
  fetch(url, configuration.fetch_options ?? {}).
    then(response => response.text()).then(responseBody => console.log(responseBody)).
    catch(err => log(err))
}

function hackURLpath (args) { // CLIENT {{{1
  return '/' + args[0];
}

async function jagURLpath (args) { // CLIENT {{{1
  switch (args[0]) {
    case '*testnet*':
      return `/topjob/hx/${await pubkey('JOBAGENT_PK')}`;
    case '*hx_selftest':
      return `/job/hx/${await pubkey('JOBAGENT_PK')}`;
  }
}

async function jclURLpath (args) { // CLIENT {{{1
  return `/${args[0]}/${await pubkey('JOBUSER_PK')}`;
}

async function jobURLpath (args) { // CLIENT {{{1
  return `/${args[0]}/${await pubkey('JOBUSER_PK')}`;
}

function log (...args) { // CLIENT {{{1
  console.log(...args)
}

async function post_jcl (node, run, cmd, ...args) { // CLIENT {{{1
  let path = await jclURLpath(args)
  let urlJcl = process.env._ == 'bin/dev.mjs' ? 'ws://127.0.0.1:8787/jcl'
    : 'wss://jag.kloudoftrust.org/jcl'
  let url = `${urlJcl}${path}`
  log('- post_jcl args', args, 'url', url, 'configuration', configuration)
  wsConnect(url)
}

async function post_job (node, run, cmd, ...args) { // CLIENT {{{1
  let path = await jobURLpath(args)
  let urlJob = process.env._ == 'bin/dev.mjs' ? 'ws://127.0.0.1:8787/job'
    : 'wss://job.kloudoftrust.org/job'
  let url = `${urlJob}${path}`
  log('- post_job args', args, 'url', url, 'configuration', configuration)
  wsConnect(url)
}

function promiseWithResolvers () { // {{{1
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return [promise, resolve, reject];
}

async function pubkey (pk) { // {{{1
  //let pair = await generate_keypair.call(crypto.subtle, )
  //return encodeURIComponent(pair.split(' ')[1]);
  return encodeURIComponent(process.env[pk]);
}

async function put_agent (node, run, cmd, ...args) { // CLIENT {{{1
  let path = await jagURLpath(args)
  let urlJag = process.env._ == 'bin/dev.mjs' ? 'ws://127.0.0.1:8787/jag'
    : 'wss://jag.kloudoftrust.org/jag'
  let url = `${urlJag}${path}`
  log('- put_agent args', args, 'url', url, 'configuration', configuration)
  wsConnect(url)
}

function setkeys() { // {{{1
  generate_keypair.call(crypto.subtle, ).then(keys => console.log(keys))
}

function wsConnect (url) { // {{{1
  let websocket = new WebSocket(url, configuration.fetch_options ?? {})
  let [promise, resolve, reject] = promiseWithResolvers()
  let tag = _ => {
    return 'ws ' + process.argv[2];
  }
  websocket.on('error', err => {
    log(`${tag()} error`, err)
    reject(err)
  })
  websocket.on('close', data => {
    log(`${tag()} close`, data)
    resolve(false)
  })
  websocket.on('open', _ => {
    log(`${tag()} open`)
    websocket.send('test message')
  })
  websocket.on('message', data => {
    data = data.toString()
    log(`${tag()} message`, data)
    wsDispatch(data, websocket)
  })
  promise.then(loop => loop ? wsConnect(url) : log(`${tag()}`, 'DONE')).
    catch(e => {
      console.error(e)
    })
}

function wsDispatch (data, ws) { // {{{1
  if (data.includes('TAKING JOB')) {
    let payload64 = uint8ToBase64(data)
    let sk = process.argv[2] == 'put_agent' ? process.env.JOBAGENT_SK : process.env.JOBUSER_SK
    crypto.subtle.importKey('jwk', JSON.parse(sk), 'Ed25519', true, ['sign']).
      then(sk => {
        return crypto.subtle.sign('Ed25519', sk, new TextEncoder().encode(payload64));
      }).then(signature => {
        let sig64 = uint8ToBase64(new Uint8Array(signature))
        log('wsDispatch TODO send ', payload64, sig64)
      }).catch(e => console.error(e))
  }
}

export { // {{{1
  configuration, hack, post_jcl, post_job, put_agent, setkeys,
}
