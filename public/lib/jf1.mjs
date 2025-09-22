const base64ToUint8 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)) // {{{1
const payload = payload64 => base64ToUint8(payload64).toString().split(',').reduce(
  (s, c)  => s + String.fromCodePoint(c), ''
)
const uint8ToBase64 = (arr) => Buffer.from(arr).toString('base64')
let log = console.log

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
    this.ws.onmessage = event => {
      let data = event.data.toString()
      try {
        this.dispatch(data)
      } catch(err) {
        log(`${tag()} ERROR`, err)
      }
      this.status != Connection.JOB_STARTED && log(`${tag()} message this`, this, 'data', data)
    }
    return promise.then(loop => loop ? this.connect() : this.done()).
      catch(e => {
        console.error(e)
      });
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
    return Promise.resolve(JSON.parse(this.result));
  }

  sign (data) { // {{{2
    let tag = _ => this.name + '.sign'
    let payload64 = uint8ToBase64(data)
    
    let send = (payload64, sig64) => {
      let pl = JSON.parse(
        payload64 == this.payload64 ? payload(payload64) : data
      )
      log(`${tag()} payload`, pl, 'this', this, 'data', data)
      this.ws.send(pl.edge ? data : JSON.stringify({ payload64, sig64 }))
      this.status = Connection.APPROVED

      if (pl.edge) {
        this.ws.send(JSON.stringify(this.opts))
        this.status = Connection.JOB_STARTED
      }
    }

    if (this.url.startsWith('wss://')) {
      crypto.subtle.importKey('jwk', JSON.parse(this.sk), 'Ed25519', true, ['sign']).
        then(sk => {
          return crypto.subtle.sign('Ed25519', sk, new TextEncoder().encode(payload64));
        }).then(signature => send(
          payload64, uint8ToBase64(new Uint8Array(signature))
        )).catch(e => console.error(e))
    } else { // use DEV_KIT.sign
      //log(`${tag()} this`, this)
      //this.payload64 && log(`${tag()} payload`, payload(this.payload64))
      if (++Connection.aux.count == +2) {
        /*
        this.ws.send(data)
        this.ws.send(JSON.stringify(this.opts))
        this.status = Connection.JOB_STARTED
        */
        send(this.payload64, this.sig64)
        return; // avoid calling 'sign' recursively
      }
      post_job(
        post_job_args(
          'DEV_KIT', 'hx/sign', decodeURIComponent(config.userKeys), payload64
        )
      ).then(r => send(r.payload64, r.sig64)).catch(e => console.error(e))
    }
    return this.status = Connection.APPROVING;
  }

  static OPEN = +1 // {{{2

  static APPROVING = +2 // {{{2

  static APPROVED = +3 // {{{2

  static READY = +4 // {{{2

  static JOB_STARTED = +5 // {{{2

  static aux = { // {{{2
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
        return log(this.result = data);
    }
    super.dispatch(data)
    switch (this.status) {
      case Connection.READY:
        this.ws.send(JSON.stringify(this.opts))
        this.status = Connection.JOB_STARTED
        log(this.name + '.dispatch Connection.JOB_STARTED', Connection.JOB_STARTED, 'this', this)
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
  if (args.length == 5) {
    url += `?${args[4]}`
  }
  log('post_job url', url)
  return new User({
    name: 'user',
    opts: { args: [] },
    sk: args[3],
    url
  }).connect();
}

function post_job_args (svcId, jobname, userKeys, payload64 = null) { // {{{1
  let [sk, pk] = userKeys.split(' ')
  if (jobname == 'hx/sign') {
    return [
      pk, svcId, jobname, sk, `sk=${encodeURIComponent(sk)}&payload64=${payload64}`
    ];
  }
  return [pk, svcId, jobname, sk];
}

export { post_job, post_job_args, } // {{{1

