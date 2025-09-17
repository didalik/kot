import { uint8ToBase64, } from './util.mjs' // {{{1

let log = console.log // {{{1
let opts = ''

class Connection { // {{{1
  constructor (base) { // {{{2
    Object.assign(this, base)
  }

  connect () { // {{{2
    this.ws = new WebSocket(this.url)
    let { promise, resolve, reject } = Promise.withResolvers()
    let tag = _ => {
      return this.name + '.connect';
    }
    this.ws.onerror = err => {
      err.message.endsWith('401') || err.message.endsWith('404') ||
        log(`${tag()} error`, err)
      reject(err)
    }
    this.ws.onclose = data => {
      log(`${tag()} close`, data)
      this.ws.close()
      resolve(false)
    }
    this.ws.onopen = _ => {
      this.status = Connection.OPEN
      log(`${tag()} open this`, this)
    }
    this.ws.onmessage = data => {
      try {
        data = data.toString()
        this.dispatch(data)
      } catch(err) {
        log(`${tag()} error`, err)
      }
      this.status != Connection.JOB_STARTED && log(`${tag()} message this`, this)
    }
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
    //process.exit() // TODO exit code
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
        log(`${tag()} payload64`, payload64, 'sig64', sig64, 'this', this, 'data', data)
        let payload = JSON.parse(data)
        if (payload.edge) {
          this.ws.send(JSON.stringify(opts.length > 0 ? opts : '{"args":[]}'))
          this.status = Connection.JOB_STARTED
        }
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

  dispatch (data) { // {{{2
    switch (this.status) {
      case Connection.JOB_STARTED:
        return log(data);
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

function post_job (args) { // no client certificate required {{{1
  let originJob =
    location.protocol.startsWith('https') ? 'wss://job.kloudoftrust.org/job'
    : 'ws://ko:8787/job' // FIXME use location.host instead of ko:8787
  let url = `${originJob}/${args[2]}/${args[1]}/${encodeURIComponent(args[0])}`
  log('post_job url', url)
  new User({
    name: 'user',
    sk: args[3],
    url
  }).connect()
}

function post_job_args (svcId, jobname, userKeys, payload64 = null) { // {{{1
  let [sk, pk] = userKeys.split(' ')
  if (jobname == 'hx/signTaking') { // FIXME
    return [pk, svcId, jobname, `sk=${encodeURIComponent(sk)}&payload64=${payload64}`];
  }
  return [pk, svcId, jobname, sk];
}

export { post_job, post_job_args, } // {{{1

