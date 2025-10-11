const base64ToUint8 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)) // {{{1
const payload = payload64 => base64ToUint8(payload64).toString().split(',').reduce(
  (s, c)  => s + String.fromCodePoint(c), ''
)
const uint8ToBase64 = (arr) => Buffer.from(arr).toString('base64')
let log = console.log

class Connection { // {{{1
  constructor (base) { // {{{2
    Object.assign(this, base)
    this.archived = []
    Connection.aux.connections.push(this)
  }

  connect () { // {{{2
    let tag = _ => {
      return this.name + '.connect';
    }
    try {
      this.ws = new WebSocket(this.url)
    } catch(err) {
      log(`${tag()} E R R O R `, err)
    }
    let { promise, resolve, reject } = Promise.withResolvers()
    this.ws.onerror = err => { // {{{3
      err.message.endsWith('401') || err.message.endsWith('404') ||
        log(`${tag()} error`, err)
      reject(err)
    }
    this.ws.onclose = data => { // {{{3
      Connection.aux.count--
      log(`${tag()} close`, data, 'Connection.aux.count', Connection.aux.count)
      this.ws.close()
      log(`${tag()} close archived`, this.archived)
      resolve(false)
    }
    this.ws.onopen = _ => { // {{{3
      this.state = Connection.OPEN
      Connection.aux.count++
      this.url.indexOf('/hx/DEV_KIT/sign/') < 0 && this.ws.send('open')
      log(`${tag()} open this`, this, 'Connection.aux.count', Connection.aux.count)
    }
    this.ws.onmessage = event => { // {{{3
      let data = event.data.toString()
      try {
        this.dispatch(data)
      } catch(err) {
        log(`${tag()} ERROR`, err)
      }
      this.state != Connection.JOB_STARTED && log(`${tag()} message this`, this, 'data', data)
    } // }}}3
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
    //process.exit() // TODO exit code
    return Promise.resolve(
      this.result.startsWith('{') ? JSON.parse(this.result) : this.result
    );
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
      this.state = Connection.CLAIMED

      if (pl.edge) {
        this.ws.send(JSON.stringify(this.opts))
        this.state = Connection.JOB_STARTED
      }
    }

    if (this.url.startsWith('wss://')) {
      crypto.subtle.importKey('jwk', JSON.parse(this.sk), 'Ed25519', true, ['sign']).
        then(sk => {
          return crypto.subtle.sign('Ed25519', sk, new TextEncoder().encode(payload64));
        }).then(signature => send(
          payload64, uint8ToBase64(new Uint8Array(signature))
        )).catch(e => console.error(e))
    } else { // DO NOT use DEV_KIT.sign
      if (this.url.indexOf('/hx/DEV_KIT/sign/') > 0) {
        send(this.payload64, this.sig64)
        return;
      }
      post_job(
        post_job_args(
          'hx', 'DEV_KIT', 'sign', decodeURIComponent(config.userKeys), payload64
        )
      ).then(r => send(r.payload64, r.sig64)).catch(e => console.error(e))
      /*
      log(`${tag()} DO SOMETHING`, 'this', this, 'data', data)
      */
    }
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
        startJob[this.job.name].call({ ws: this.ws }, { args: this.args })
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
        return log(this.result = data);
    }
    super.dispatch(data)
    switch (this.state) {
      case Connection.READY:
        this.ws.send(JSON.stringify(this.opts))
        this.state = Connection.JOB_STARTED
        log(this.name + '.dispatch Connection.JOB_STARTED', Connection.JOB_STARTED, 'this', this)
        break
    }
  }

  // }}}2
}

function post_job (args, opts = {args:[]}) { // no client certificate required {{{1
  let originJob =
    location.protocol.startsWith('https') ? 'wss://job.kloudoftrust.org/job'
    : 'ws://ko:8787/job' // FIXME use location.host instead of ko:8787
  let url = `${originJob}/${args[1]}/${args[2]}/${args[3]}/${encodeURIComponent(args[0])}`
  if (args.length == 6) {
    url += `?${args[5]}`
  }
  log('post_job url', url, 'args', args, 'opts', opts)
  return new User({
    kitId: args[1],
    name: 'user',
    opts,
    sk: args[4],
    url
  }).connect();
}

function post_job_args (appId, kitId, jobname, userKeys, payload64 = null) { // {{{1
  let [sk, pk] = userKeys.split(' ')
  if (kitId == 'DEV_KIT' && appId + '/' + jobname == 'hx/sign') {
    return [
      pk, 
      appId, 
      kitId, 
      jobname, 
      sk, 
      `sk=${encodeURIComponent(sk)}&payload64=${payload64}`
    ];
  }
  return [pk, appId, kitId, jobname, sk];
}

export { post_job, post_job_args, } // {{{1

