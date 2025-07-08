import fetch from 'node-fetch' // // CLIENT {{{1
import WebSocket from 'ws'

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

function jagURLpath (args) { // CLIENT {{{1
  switch (args[0]) {
    case '*testnet*':
      return '/topjob/hx';
    case '*hx_selftest':
      return '/job/hx';
  }
}

function jclURLpath (args) { // CLIENT {{{1
  return `/${args[0]}`;
}

function jobURLpath (args) { // CLIENT {{{1
  return `/${args[0]}`;
}

function log (...args) { // CLIENT {{{1
  console.log(...args)
}

async function post_jcl (node, run, cmd, ...args) { // CLIENT {{{1
  let path = jclURLpath(args)
  let urlJcl = process.env._ == 'bin/dev.mjs' ? 'ws://127.0.0.1:8787/jcl'
    : 'wss://jag.kloudoftrust.org/jcl'
  let url = `${urlJcl}${path}`
  log('- post_jcl args', args, 'url', url, 'configuration', configuration)
  wsConnect(url)
}

async function post_job (node, run, cmd, ...args) { // CLIENT {{{1
  let path = jobURLpath(args)
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

async function put_agent (node, run, cmd, ...args) { // CLIENT {{{1
  let path = jagURLpath(args)
  let urlJag = process.env._ == 'bin/dev.mjs' ? 'ws://127.0.0.1:8787/jag'
    : 'wss://jag.kloudoftrust.org/jag'
  let url = `${urlJag}${path}`
  log('- put_agent args', args, 'url', url, 'configuration', configuration)
  wsConnect(url)
}

function wsConnect (url) { // {{{1
  let websocket = new WebSocket(url, configuration.fetch_options ?? {})
  let [promise, resolve, reject] = promiseWithResolvers()
  websocket.on('error', err => {
    log('websocket error', err)
    reject(err)
  })
  websocket.on('close', data => {
    log('websocket close', data)
    resolve(false)
  })
  websocket.on('open', _ => {
    log('websocket open')
    websocket.send('test message')
  })
  websocket.on('message', data => {
    log('websocket message', data.toString())
    //websocket.close()
  })
  promise.then(loop => loop ? wsConnect(url) : log('wsConnect url', url, 'DONE')).
    catch(e => {
      console.error(e)
    })
}

export { configuration, hack, post_jcl, post_job, put_agent, } // {{{1

