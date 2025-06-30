import fetch from 'node-fetch' // // CLIENT {{{1
import WebSocket from 'ws'

const configuration = {} // CLIENT {{{1

function jagURLpath (args) { // CLIENT {{{1
  return '?json={"XA":"XO"}';
}

function jclURLpath (args) { // CLIENT {{{1
  return '?json={"XA":"XO"}';
}

function jobURLpath (args) { // CLIENT {{{1
  return '?json={"XA":"XO"}';
}

function log (...args) { // CLIENT {{{1
  console.log(...args)
}

async function post_jcl (node, run, cmd, ...args) { // CLIENT {{{1
  let path = jclURLpath(args)
  let urlJcl = process.env._ == 'bin/dev.mjs' ? 'http://127.0.0.1:8787/jcl'
    : 'https://jag.kloudoftrust.org/jcl'
  let url = `${urlJcl}${path}`
  log('- post_jcl args', args, 'url', url, 'configuration', configuration)
  //fetch(url, configuration.fetch_options ?? {}).then(response => response.text()).then(responseBody => console.log(responseBody)).catch(err => console.log(err))
  websocketLoop(url)
}

async function post_job (node, run, cmd, ...args) { // CLIENT {{{1
  let path = jobURLpath(args)
  let urlJob = process.env._ == 'bin/dev.mjs' ? 'http://127.0.0.1:8787/job'
    : 'https://job.kloudoftrust.org/job'
  let url = `${urlJob}${path}`
  log('- post_job args', args, 'url', url, 'configuration', configuration)
  websocketLoop(url)
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
  let urlJag = process.env._ == 'bin/dev.mjs' ? 'http://127.0.0.1:8787/jag'
    : 'https://jag.kloudoftrust.org/jag'
  let url = `${urlJag}${path}`
  log('- put_agent args', args, 'url', url, 'configuration', configuration)
  websocketLoop(url)
}

function websocketLoop (url) { // keep re-connecting to the websocket {{{1
  let websocket = new WebSocket(url.replace('http', 'ws'))
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
    websocket.close()
  })
  promise.then(loop => loop ? websocketLoop(url) : log('websocketLoop url', url, 'DONE')).catch(e => console.error(e))
}

export { configuration, post_jcl, post_job, put_agent, } // {{{1

