import fetch from 'node-fetch' // // CLIENT {{{1
import WebSocket from 'ws'
import { spawn } from 'node:child_process'
import { base64ToUint8, generate_keypair, uint8ToBase64, } from '../../public/lib/util.mjs'
import { reset_testnet, reset_testnet_monitor, } from '../module-topjob-hx-agent/lib/list.mjs'
import { selftest, setup_selftest, test_signTaking, } from '../module-job-hx-agent/lib/list.mjs'

const configuration = {} // CLIENT {{{1
const startJob = {
  reset_testnet, reset_testnet_monitor, selftest, setup_selftest, test_signTaking,
}

async function hack (node, run, cmd, ...args) { // CLIENT {{{1
  let path = hackURLpath(args)
  let urlHack = configuration.fetch_options ? 'http://127.0.0.1:8787/hack'
    : 'https://jag.kloudoftrust.org/hack'
  let url = `${urlHack}${path}`
  log('- hack args', args, 'url', url)
  fetch(url, configuration.fetch_options ?? {}).
    then(response => response.text()).then(responseBody => log(responseBody)).
    catch(err => log(err))
}

function hackURLpath (args) { // CLIENT {{{1
  return '/' + args[0];
}

function jagURLpath (args) { // CLIENT {{{1
  switch (args[1]) {
    case '*testnet*':
      return `/topjob/hx/${encodeURIComponent(args[0])}`;
    case '*selftest':
      return `/job/hx/${encodeURIComponent(args[0])}`;
  }
}

function jclURLpath (args) { // CLIENT {{{1
  let urlPath = `/${args[1]}/${encodeURIComponent(args[0])}`
  if (args[1] == 'hx/dopad') {
    urlPath += '/' + args[2] + '?' + `${args[3]}=${encodeURIComponent(args[4])}`
  }
  return urlPath;
}

function jobURLpath (args) { // CLIENT {{{1
  if (args[1] == 'hx/selftest' && args[2] && args[2].indexOf('=')) {
    let pair = args[2].split('=')
    configuration[pair[0]] = pair[1]
  }
  return `/${args[1]}/${encodeURIComponent(args[0])}`;
}

function log (...args) { // CLIENT {{{1
  console.log(...args)
}

async function post_jcl (node, run, cmd, ...args) { // CLIENT {{{1
  let path = await jclURLpath(args)
  let urlJcl = configuration.fetch_options ? 'wss://jag.kloudoftrust.org/jcl'
    : 'ws://127.0.0.1:8787/jcl'
  let url = `${urlJcl}${path}`
  log('- post_jcl args', args, 'url', url)
  wsConnect(url)
}

async function post_job (node, run, cmd, ...args) { // CLIENT {{{1
  let path = await jobURLpath(args)
  let urlJob = configuration.fetch_options ? 'wss://job.kloudoftrust.org/job'
    : 'ws://127.0.0.1:8787/job'
  let url = `${urlJob}${path}`
  log('- post_job args', args, 'url', url)
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

async function put_agent (node, run, cmd, ...args) { // CLIENT {{{1
  let path = await jagURLpath(args)
  let urlJag = configuration.fetch_options ? 'wss://jag.kloudoftrust.org/jag'
    : 'ws://127.0.0.1:8787/jag'
  let url = `${urlJag}${path}`
  log('- put_agent args', args, 'url', url)
  wsConnect(url)
}

function setkeys() { // {{{1
  generate_keypair.call(crypto.subtle, ).then(keys => log(keys))
}

function start_testnet_monitor (node, run, cmd, nwdir, ...args) { // CLIENT {{{1
  log('-', run, cmd, 'nwdir', nwdir)
}

function wsConnect (url) { // {{{1
  let websocket = new WebSocket(url, configuration.fetch_options ?? {})
  let [promise, resolve, reject] = promiseWithResolvers()
  let tag = _ => {
    return 'ws ' + process.argv[2];
  }
  websocket.on('error', err => {
    err.message.endsWith('401') || err.message.endsWith('404') ||
      log(`${tag()} error`, err)
    reject(err)
  })
  websocket.on('close', data => {
    log(`${tag()} close`, data)
    resolve(false)
  })
  websocket.on('open', _ => {
    log(`${tag()} open`)
  })
  websocket.on('message', data => {
    data = data.toString()
    log(`${tag()} message`, data)
    //if (data == 'DONE') {
      //process.exit(0)
    //}
    wsDispatch(data, websocket)
  })
  promise.then(loop => loop ? wsConnect(url) : log(`${tag()}`, 'DONE')).
    catch(e => {
      console.error(e)
    })
}

function wsDispatch (data, ws) { // {{{1
  let jobname = data.slice(1 + data.lastIndexOf(' '))
  if (data.includes('TAKING JOB')) { // {{{2
    if (data.includes('AM TAKING JOB')) {
      global.jobAgentId = data.slice(0, data.indexOf(' '))
    }
    let payload64 = uint8ToBase64(data)
    let sk = process.argv[2] == 'put_agent' ? process.env.JOBAGENT_SK : process.env.JOBUSER_SK
    crypto.subtle.importKey('jwk', JSON.parse(sk), 'Ed25519', true, ['sign']).
      then(sk => {
        return crypto.subtle.sign('Ed25519', sk, new TextEncoder().encode(payload64));
      }).then(signature => {
        let sig64 = uint8ToBase64(new Uint8Array(signature))
        log('wsDispatch payload64', payload64, 'sig64', sig64)

        ws.send(JSON.stringify({ payload64, sig64 }))
      }).catch(e => console.error(e))
  } else if (data.includes('START JOB')) { // {{{2
    global.log = log
    startJob[jobname].call({ ws })
  } else if (data.includes('STARTED JOB')) { // {{{2
    configuration.browser && spawn('bin/test-browser', [configuration.browser])
    delete configuration.browser
  } else if (data.includes('EXIT CODE') || data == 'DONE') { // {{{2
    ws.close()
  } // }}}2
}

export { // {{{1
  configuration, hack, post_jcl, post_job, put_agent, setkeys, start_testnet_monitor,
}
