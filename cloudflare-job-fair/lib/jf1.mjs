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
let opts

class Connection { // {{{1
  constructor (base) { // {{{2
    Object.assign(this, base)
  }

  connect () { // {{{2
    this.ws = new WebSocket(this.url, configuration.fetch_options ?? {})
    let [promise, resolve, reject] = promiseWithResolvers()
    let tag = _ => {
      return this.name + '.connect';
    }
    this.ws.on('error', err => {
      err.message.endsWith('401') || err.message.endsWith('404') ||
        log(`${tag()} error`, err)
      reject(err)
    })
    this.ws.on('close', data => {
      log(`${tag()} close`, data)
      this.ws.close()
      resolve(false)
    })
    this.ws.on('open', _ => {
      this.status = Connection.OPEN
      log(`${tag()} open this`, this)
    })
    this.ws.on('message', data => {
      try {
        data = data.toString()
        this.dispatch(data)
      } catch(err) {
        log(`${tag()} error`, err)
      }
      this.status != Connection.JOB_STARTED && log(`${tag()} message this`, this)
    })
    promise.then(loop => loop ? this.connect() : this.done()).
      catch(e => {
        console.error(e)
      })
  }
  
  dispatch (data) { // {{{2
    let o = JSON.parse(data)
    let tag = _ => this.name + '.dispatch'
    log(`${tag()} parsed`, o)
    Object.assign(this, o)
    switch (this.status) {
      case Connection.OPEN:
        return this.sign(data);
      case Connection.APPROVED:
        if (this.ready) {
          this.status = Connection.READY
        }
        break
    }
  }

  done () { // {{{2
    let tag = _ => {
      return this.name + '.done';
    }
    log(`${tag()}`, 'DONE')
    process.exit() // TODO exit code
  }

  sign (data) { // {{{2
    let tag = _ => this.name + '.sign'
    let payload64 = uint8ToBase64(data)
    crypto.subtle.importKey('jwk', JSON.parse(this.sk), 'Ed25519', true, ['sign']).
      then(sk => {
        return crypto.subtle.sign('Ed25519', sk, new TextEncoder().encode(payload64));
      }).then(signature => {
        let sig64 = uint8ToBase64(new Uint8Array(signature))
        this.ws.send(JSON.stringify({ payload64, sig64 }))
        this.status = Connection.APPROVED
        log(`${tag()} payload64`, payload64, 'sig64', sig64, 'this', this)
      }).catch(e => console.error(e))
    return this.status = Connection.APPROVING;
  }

  static OPEN = +1 // {{{2

  static APPROVING = +2 // {{{2

  static APPROVED = +3 // {{{2

  static READY = +4 // {{{2

  static JOB_STARTED = +5 // {{{2

  // }}}2
}

class Agent extends Connection { // {{{1
  constructor (base) { // {{{2
    super(base)
  }

//  connect () { // {{{2
  //  super.connect()
  //}

  dispatch (data) { // {{{2
    super.dispatch(data)
    switch (this.status) {
      case Connection.READY:
        if (this.ready) {
          delete this.ready
          return;
        }
        startJob[this.job.name].call({ ws: this.ws }, { args: this.args })
        this.status = Connection.JOB_STARTED
        break
    }
  }

  // }}}2
}

class User extends Connection { // {{{1
  constructor (base) { // {{{2
    super(base)
  }

//  connect () { // {{{2
  //  super.connect()
  //}

  dispatch (data) { // {{{2
    //let tag = _ => this.name + '.dispatch'
    switch (this.status) {
      case Connection.JOB_STARTED:
        return log(/*`${tag()} data`, */data);
    }
    super.dispatch(data)
    switch (this.status) {
      case Connection.READY:
        this.ws.send(JSON.stringify(opts))
        this.status = Connection.JOB_STARTED
        break
    }
  }

  // }}}2
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
/*
- put_agent args [
  'n0EMjrNk4jO/35/1d+kthvycSUm/+Sjy89Ux2ZGRNV0=',             // 0
  'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ', // 1
  '*testnet*',                                                // 2
  'hx'                                                        // 3
] url ws://127.0.0.1:8787/jag/hx/top/GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ/n0EMjrNk4jO%2F35%2F1d%2BkthvycSUm%2F%2BSjy89Ux2ZGRNV0%3D
*/
  switch (args[3]) {
    case 'hx':
      switch (args[2]) {
        case '*testnet*':
          return `/${args[3]}/top/${args[1]}/${encodeURIComponent(args[0])}`;
        case '*selftest':
          return `/${args[3]}/${args[1]}/${encodeURIComponent(args[0])}`;
      }
    default:
      throw Error(args[3]);
  }
}

function jclURLpath (args) { // CLIENT {{{1
/*
- post_jcl args [
  'n0EMjrNk4jO/35/1d+kthvycSUm/+Sjy89Ux2ZGRNV0=',              // 0
  'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ',  // 1
  'hx/reset_testnet'                                           // 2
] url ws://127.0.0.1:8787/jcl/hx/reset_testnet/GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ/n0EMjrNk4jO%2F35%2F1d%2BkthvycSUm%2F%2BSjy89Ux2ZGRNV0%3D
*/
  let urlPath = `/${args[2]}/${args[1]}/${encodeURIComponent(args[0])}`
  if (args[2] == 'hx/dopad') {
/*
- post_jcl args [
  'n0EMjrNk4jO/35/1d+kthvycSUm/+Sjy89Ux2ZGRNV0=',              // 0
  'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ',  // 1
  'hx/dopad',                                                  // 2
  'put',                                                       // 3
  'hx_STELLAR_NETWORK',                                        // 4
  'testnet'                                                    // 5
]
*/
    urlPath += '/' + args[3] + '?' + `${args[4]}=${encodeURIComponent(args[5])}`
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

function post_jcl (node, run, cmd, ...args) { // CLIENT {{{1
  let path = jclURLpath(args)
  let urlJcl = configuration.fetch_options ? 'wss://jag.kloudoftrust.org/jcl'
    : 'ws://127.0.0.1:8787/jcl'
  let url = `${urlJcl}${path}`
  log('- post_jcl args', args, 'url', url)
  new User({
    name: 'user',
    sk: process.env.JOBUSER_SK,
    topSvc: true, 
    url
  }).connect()
}

async function post_job (node, run, cmd, ...args) { // CLIENT {{{1
  let path = await jobURLpath(args)
  let urlJob = configuration.fetch_options ? 'wss://job.kloudoftrust.org/job'
    : 'ws://127.0.0.1:8787/job'
  let url = `${urlJob}${path}`
  log('- post_job args', args, 'url', url)
  new User({
    name: 'user',
    sk: process.env.JOBUSER_SK,
    url
  }).connect()
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
  new Agent({
    name: 'agent',
    sk: process.env.JOBAGENT_SK,
    url
  }).connect()
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
    --configuration.jobCount || resolve(false)
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
      configuration.jobCount ??= 0
      configuration.jobCount++
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
  } else if (data.includes('EXIT CODE') || data.startsWith('DONE')) { // {{{2
    ws.close()
  } // }}}2
}

opts = ''
process.stdin.resume(); // {{{1
process.stdin.on("data", function (chunk) { return opts += chunk; });
process.stdin.on("end", _ => console.log(`${process.argv[2]} opts`, opts = JSON.parse(opts.length > 0 ? opts : '{}')));

export { // {{{1
  configuration, hack, post_jcl, post_job, put_agent, setkeys, start_testnet_monitor,
}
