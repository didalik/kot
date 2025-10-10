import * as hxKit from '../module-job-hx-agent/src/list.js' // {{{1
import * as hxTopKit from '../module-topjob-hx-agent/src/list.js'

const base64ToUint8 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
const uint8ToBase64 = (arr) => Buffer.from(arr).toString('base64')

class Ad { // handshake: match -> open -> make -> claim -> take -> pipe {{{1
  constructor (base) { // {{{2
    Object.assign(this, base)
    this.job.offerQueue ??= []
    this.job.requestQueue ??= []
    this.state = Ad.OPENING
    this.matched = {}; Object.assign(this.matched, Promise.withResolvers())
    Ad.ws2ad.set(this.ws, this)
  }

  make (making) { // {{{2
    delete this.matched
    this.ws.send(JSON.stringify(making))
    this.state = Ad.CLAIMING // claiming the making of the match
  }

  onclose (...args) { // {{{2
    this.ws.close()
    this.match.ws && this.match.ws.close()
    Ad.ws2ad.delete(this.ws)
    console.log('Ad.onclose this', this, 'args', args)
  }

  onmessage (message, match) { // {{{2
    console.log('Ad.onmessage this.state', this.state, 'this.job.name', this.job.name, 'message', message, 'match', match)
    switch (this.state) {
      case Ad.OPENING:
        return this.matched.promise.then(_ => this.make(this[match]));
      case Ad.CLAIMING:
        return this.verify(JSON.parse(message), match);
      case Ad.PIPING:
        return this[match].ws.send(message);
      default:
        throw Error('Ad onmessage this.state ' + this.state);
    }
  }

  verify (jso, match = null) { // {{{2
    console.log('Ad.verify jso', jso, 'match', match, 'this.job', this.job, 'this.state', this.state)
    let a = base64ToUint8(this.pk)
    let signature = base64ToUint8(jso.sig64)
    let signedData = data => base64ToUint8(data).toString().split(',').reduce((s, c) => s + String.fromCodePoint(c), '')
    crypto.subtle.importKey('raw', a.buffer, 'Ed25519', true, ['verify']).
      then(pk => crypto.subtle.verify('Ed25519', pk, signature, new TextEncoder().encode(jso.payload64))).
      then(r => {
        if (!r) { // TODO handle verify false - no approval
          return;
        }
        let payload = signedData(jso.payload64)
        this.state = Ad.TAKEN // TODO compare payload with the saved one in 'take' method
        if (!!match && this[match].state == Ad.TAKEN) {
          this.state = Ad.PIPING
          this[match].state = Ad.PIPING
          let ready = JSON.stringify({ ready: true })
          this.ws.send(ready)
          this[match].ws.send(ready)
        } else if (this.job.userDone) {
          this.state = Ad.PIPING
        }
        console.log('Ad.verify payload', payload, 'match', match, 'this.job', this.job, 'this.state', this.state)
      })
  }

  static OPENING = +0 // {{{2

  static CLAIMING = +1 // client: sign {{{2

  static TAKEN = +2 // edge: verify {{{2

  static PIPING = +3 // {{{2

  //static durableObject // {{{2

  static ws2ad = new Map() // {{{2

  // }}}2
}

class Offer extends Ad { // {{{1

  constructor (base) { // {{{2
    super(base)
    let match = this.match()
    if (match) {
      this.reqst = match
      match.offer = this
      this.matched.resolve()
      match.matched.resolve()
      Ad.ws2ad.set(match.ws, match)
    } else {
      this.job.offerQueue.push(this)
    }
  }

  make (match) { // {{{2
    let { kitId, topKit, userId } = match
    let making = { jobname: match.job.name, kitId, topKit, userId }
    super.make(making)
  }

  match () { // {{{2
    return this.job.requestQueue.shift();
  }

  onmessage (message) { // {{{2
    super.onmessage(message, 'reqst')
  }

  // }}}2
}

class Reqst extends Ad { // {{{1

  constructor (base) { // {{{2
    super(base)
    let done = this.job.userDone
    if (done) { // job done on edge, agent not required
      this.job.payload2sign.call(this)
      return;
    }
    let match = this.match()
    if (match) {
      this.offer = match
      match.reqst = this
      this.matched.resolve()
      match.matched.resolve()
      Ad.ws2ad.set(match.ws, match) // TODO close other offers from that agent
    } else {
      this.job.requestQueue.push(this)
    }
  }

  make (match) { // {{{2
    let { agentId, kitId, topKit } = match
    let making = { agentId, jobname: match.job.name, kitId, topKit }
    super.make(making)
  }

  match () { // {{{2
    return this.job.offerQueue.shift();
  }

  onmessage (message) { // {{{2
    if (!this.job.userDone) {
      return super.onmessage(message, 'offer');
    }
    if (this.state == Ad.PIPING) {
      this.job.userDone(this). //, this.durableObject, JSON.parse(message)).
        then(bool => {
          console.log('reqst.job.userDone bool', bool)
        })
      return;
    }
    return this.verify(JSON.parse(message));
  }

  // }}}2
}

const JobFairImpl = { // {{{1
  dispatch: function (request, env_OR_ws, ctx_OR_null = null) { // {{{2
    let url = new URL(request.url)
    let agent = url.pathname.startsWith('/jag')
    if (ctx_OR_null) { // EDGE {{{3
      let ctx = ctx_OR_null, env = env_OR_ws
      if (agent) {
        return addOffer(request, env, ctx, );
      } else {
        return addReqst(request, env, ctx, url.pathname);
      }
    }
    //Ad.durableObject ??= this {{{3
    console.log('-----------------------------', 
      this.ctx.id.equals(this.env.KOT_DO_WSH_ID)
    )
    let path = url.pathname.split('/')
    let parms = new URLSearchParams(url.search)
    console.log('JobFairImpl.dispatch path', path, 'parms', parms)
/*
JobFairImpl.dispatch path [
  '',
  'job',
  'hx',
  'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ',
  'selftest',
  'n0EMjrNk4jO%2F35%2F1d%2BkthvycSUm%2F%2BSjy89Ux2ZGRNV0%3D'
] parms URLSearchParams(0) {}
---
JobFairImpl.dispatch path [
  '',
  'jag',
  'hx',
  'HX_KIT',
  'get_txid_pos',
  'n0EMjrNk4jO%2F35%2F1d%2BkthvycSUm%2F%2BSjy89Ux2ZGRNV0%3D'
] parms URLSearchParams(0) {}
*/
    let ws = env_OR_ws
    let actor_id = actorId(request.cf.tlsClientAuth.certSubjectDN) 
    if (agent) {
      let topKit = path[3] == 'top'
      let pk = decodeURIComponent(path[topKit ? 6 : 5])
      addOfferDO.call(this, ws, path, pk, parms, topKit, actor_id)
    } else {
      let pk = decodeURIComponent(path[5])
      addReqstDO.call(this, ws, path, pk, parms, actor_id)
    } // }}}3
  },

  wsClose: (ws, ...args) => { // {{{2
    console.log('JobFairImpl wsClose args', args)
    ws.close()
    let ad = Ad.ws2ad.get(ws)
    ad.onclose(...args)
  },

  wsDispatch: (data, ws) => { // {{{2
    Ad.ws2ad.get(ws).onmessage(data)
  },

  // }}}2
}

function addOffer (request, env, ctx) { // {{{1
  let stub = env.KOT_DO.get(env.KOT_DO_WSH_ID)
  return stub.fetch(request);
}

function addOfferDO (ws, path, pk, parms, topKit, agentId) { // {{{1
/* {{{2
JobFairImpl.dispatch path [
  '',
  'jag',
  'hx',
  'HX_KIT',
  'issuerSign',
  'n0EMjrNk4jO%2F35%2F1d%2BkthvycSUm%2F%2BSjy89Ux2ZGRNV0%3D'
]
*/ // }}}2
  let kit = topKit ? hxTopKit : hxKit
  let index = topKit ? 4 : 3
  let [kitId, jobname] = path.slice(index, index + 2)
  let job = kit[kitId].jobs.find(job => job.name == jobname)
  if (job.agentAuth) {
    job.agentAuth(pk, this.env)
    new Offer({ agentId, job, kitId, parms, pk, topKit, ws, })
  }
}

function addReqst (request, env, ctx, pathname) { // {{{1
  if (pathname == '/hack/do0') { // DONE
    try {
      let stub = env.KOT_DO.get(env.KOT_DO.idFromName('JobFair webSocket with Hibernation'))
      return stub.deleteAll().then(r => new Response(`- stub.deleteAll ${r}`));
    }
    catch (err) {
      return new Response(`${err}`);
    }
  }
  let stub = env.KOT_DO.get(env.KOT_DO_WSH_ID)
  return stub.fetch(request);
}

function addReqstDO (ws, path, pk, parms, userId) { // {{{1
  let topKit = path[1] == 'jcl'
  let kit = topKit ? hxTopKit : hxKit
  let index = topKit ? 4 : 3
  let [kitId, jobname] = path.slice(index, index + 2)
  let job = kit[kitId].jobs.find(job => job.name == jobname)
  job.userAuth(pk, this.env)
  new Reqst({ job, kitId, parms, pk, topKit, userId, ws, })
}

function actorId (certSubjectDN) { // {{{1
  if (certSubjectDN.length == 0) {
    return 'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ'; // local dev
  } //      ....:....1....:....2....:....3....:....4....:....5....:.
  let index = certSubjectDN.indexOf('OU=') + 3
  return certSubjectDN.slice(index, index + 56);
}

export { JobFairImpl, } // {{{1

