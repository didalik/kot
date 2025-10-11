import fetch from 'node-fetch' // // CLIENT {{{1
import WebSocket from 'ws'
import { spawn } from 'node:child_process'
import { base64ToUint8, generate_keypair, uint8ToBase64, } from '../../public/lib/util.mjs'
import * as tjAg from '../module-topjob-hx-agent/lib/list.mjs'
import * as jAg from '../module-job-hx-agent/lib/list.mjs'

const configuration = {} // CLIENT {{{1
let opts = ''

class Connection { // {{{1
  constructor (base) { // {{{2
    Object.assign(this, base)
    this.archived = []
    Connection.aux.connections.push(this)
  }

  connect () { // {{{2
    this.ws = new WebSocket(this.url, configuration.fetch_options ?? {})
    let { promise, resolve, reject } = promiseWithResolvers()
    let tag = _ => {
      return this.name + '.connect';
    }
    this.ws.on('error', err => { // {{{3
      err.message.endsWith('401') || err.message.endsWith('404') ||
        log(`${tag()} error`, err)
      reject(err)
    })
    this.ws.on('close', data => { // {{{3
      log(`${tag()} close`, data)
      this.ws.close()
      log(`${tag()} close archived`, this.archived)
      resolve(false)
    })
    this.ws.on('open', _ => { // {{{3
      this.state = Connection.OPEN
      this.ws.send('open')
      log(`${tag()} open`)
    })
    this.ws.on('message', data => { // {{{3
      try {
        data = data.toString()
        this.dispatch(data)
      } catch(err) {
        log(`${tag()} ERROR`, err)
      }
      //this.state != Connection.JOB_STARTED && log(`${tag()} message data`, data)
    }) // }}}3
    promise.then(loop => loop ? this.connect() : this.done()).
      catch(e => {
        console.error('UNEXPECTED', e); process.exit(1)
      })
  }
  
  dispatch (data) { // {{{2
    let o = JSON.parse(data)
    let tag = _ => this.name + '.dispatch'
    log(`${tag()} parsed`, o, 'this.state', this.state)
    Object.assign(this, o)
    this.archived.push({ now: Date.now(), o, state: this.state })
    switch (this.state) {
      case Connection.OPEN:
        return this.sign(data);
      case Connection.CLAIMED:
        if (this.ready) {
          this.state = Connection.READY
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
        this.state = Connection.CLAIMED
        log(`${tag()} payload64`, payload64, 'sig64', sig64, 'data', data)
        let payload = JSON.parse(data)
        if (payload.edge) {
          this.ws.send(JSON.stringify(opts.length > 0 ? opts : '{"args":[]}'))
          this.state = Connection.JOB_STARTED
        }
      }).catch(e => console.error(e))
    return this.state = Connection.CLAIMING;
  }

  static OPEN = +0 // {{{2

  static CLAIMING = +1 // {{{2

  static CLAIMED = +2 // {{{2

  static READY = +3 // {{{2

  static JOB_STARTED = +4 // {{{2

  static aux = { // {{{2
    connections: [],
    count: +0,
  }

  // }}}2
}

class Agent extends Connection { // {{{1
  constructor (base) { // {{{2
    super(base)
  }

  dispatch (data) { // {{{2
    super.dispatch(data)
    switch (this.state) {
      case Connection.READY:
        if (this.ready) {
          delete this.ready
          return;
        }
        let agent = this.topKit ? tjAg : jAg
        agent[this.kitId][this.jobname].call({ ws: this.ws }, 
          { args: this.args }
        )
        this.state = Connection.JOB_STARTED
        break
    }
  }

  // }}}2
}

class User extends Connection { // {{{1
  constructor (base) { // {{{2
    super(base)
  }

  dispatch (data) { // {{{2
    switch (this.state) {
      case Connection.JOB_STARTED:
        configuration.browser && spawn('bin/test-browser', [configuration.browser])
        delete configuration.browser
        return log(data);
    }
    super.dispatch(data)
    switch (this.state) {
      case Connection.READY:
        this.ws.send(JSON.stringify(opts))
        this.state = Connection.JOB_STARTED
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

function post_job (node, run, cmd, ...args) { // {{{1
/* {{{2
- post_job args [
  'n0EMjrNk4jO/35/1d+kthvycSUm/+Sjy89Ux2ZGRNV0=',
  'hx',
  'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ',
  'selftest',
  'browser=http://ko:8787/hx'
]
*/ // }}}2
  configuration.promise.then(opts => {
    let path = '/' + args[1] + (opts.top ? '/top/' : '/') + args[2] + '/' +
      args[3] + '/' + encodeURIComponent(args[0])
    let urlJob = configuration.fetch_options ? 'wss://job.kloudoftrust.org/job'
      : 'ws://127.0.0.1:8787/job'
    let url = `${urlJob}${path}`
    if (args[4].startsWith('browser=')) {
      configuration.browser = args[4].slice(8)
    }
    log('- post_job args', args, 'opts', opts, 'url', url, 'configuration', configuration)
    new User({
      kitId: args[1],
      name: 'user',
      opts,
      sk: process.env.JOBUSER_SK,
      url
    }).connect()
  })
}

function promiseWithResolvers () { // {{{1
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function put_agent (node, run, cmd, ...args) { // {{{1
  configuration.promise.then(opts => {
    log('- put_agent args', args, 'opts', opts)
    for (let job of opts.jobs) {
      let path = '/' + args[1] + (opts.top ? '/top/' : '/') + args[2] + '/' +
        job + '/' + encodeURIComponent(args[0])
      let urlJag = configuration.fetch_options ? 'wss://jag.kloudoftrust.org/jag'
        : 'ws://127.0.0.1:8787/jag'
      let url = `${urlJag}${path}`
      log('- put_agent url', url)
      new Agent({
        kitId: args[2],
        name: 'agent',
        sk: process.env.JOBAGENT_SK,
        url
      }).connect()
    }
  })
}

function setkeys() { // {{{1
  generate_keypair.call(crypto.subtle, ).then(keys => log(keys))
}

function start_testnet_monitor (node, run, cmd, nwdir, ...args) { // CLIENT {{{1
  log('-', run, cmd, 'nwdir', nwdir)
}

process.stdin.resume(); // {{{1
process.stdin.on("data", function (chunk) { return opts += chunk; });
process.stdin.on("end", _ => configuration.resolve(
  opts = JSON.parse(opts.length > 0 ? opts : '{}')
));
process.on('SIGINT', _ => {
  console.log('process.on SIGINT', process.argv)
  for (let c of Connection.aux.connections) {
    console.log(c.archived)
  }
  process.exit(2)
})
export { // {{{1
  configuration, hack, 
  post_jcl, post_job, 
  promiseWithResolvers,
  put_agent, setkeys, start_testnet_monitor,
}
