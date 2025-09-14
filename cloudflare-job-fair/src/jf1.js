import * as hxSvc from '../module-job-hx-agent/src/list.js' // {{{1
import * as hxTopSvc from '../module-topjob-hx-agent/src/list.js'

let durableObject; // {{{1
const base64ToUint8 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
const uint8ToBase64 = (arr) => Buffer.from(arr).toString('base64')

class Ad { // {{{1
  constructor (base) { // {{{2
    Object.assign(this, base)
    this.job.offerQueue ??= []
    this.job.requestQueue ??= []
    Ad.ws2ad.set(this.ws, this)
    let match = this.match()
    if (match) {
      this.match = match
      match.match = this
      this.status = this.take(match)
      match.status = match.take(this)
      Ad.ws2ad.set(match.ws, match)
    }
  }

  onclose (...args) { // {{{2
    this.ws.close()
    this.match.ws && this.match.ws.close()
    Ad.ws2ad.delete(this.ws)
    console.log('Ad.onclose this', this, 'args', args)
  }

  onmessage (message) { // {{{2
    console.log('Ad.onmessage this', this, 'message', message)
    switch (this.status) {
      case Ad.TAKING_MATCH:
        return this.verify(JSON.parse(message));
      case Ad.PIPING:
        return this.match.ws.send(message);
    }
  }

  verify (json) { // {{{2
    let a = base64ToUint8(this.pk)
    let signature = base64ToUint8(json.sig64)
    let signedData = data => base64ToUint8(data).toString().split(',').reduce((s, c) => s + String.fromCodePoint(c), '')
    crypto.subtle.importKey('raw', a.buffer, 'Ed25519', true, ['verify']).
      then(pk => crypto.subtle.verify('Ed25519', pk, signature, new TextEncoder().encode(json.payload64))).
      then(r => {
        if (!r) { // TODO handle verify false - no approval
          return;
        }
        let payload = signedData(json.payload64)
        this.status = Ad.MATCH_TAKEN // TODO compare payload with the saved one in 'take' method
        console.log('Ad.verify payload', payload, 'this', this)
        if (this.match.status == Ad.MATCH_TAKEN) {
          let ready = JSON.stringify({ ready: true })
          this.ws.send(ready)
          this.match.ws.send(ready)
          this.status = Ad.PIPING
          this.match.status = Ad.PIPING
        }
      })
  }

  static TAKING_MATCH = +1 // {{{2

  static MATCH_TAKEN = +2 // {{{2

  static PIPING = +3 // {{{2

  static ws2ad = new Map() // {{{2

  // }}}2
}

class Offer extends Ad { // {{{1

  constructor (base) { // {{{2
    super(base)
    this.status == Ad.TAKING_MATCH || this.job.offerQueue.push(this)
    console.log('new Offer', this)
  }

  match () { // {{{2
    return this.job.requestQueue.shift();
  }

  take (match) { // {{{2
    console.log('Offer.take match', match)
    this.ws.send(JSON.stringify({
      job: {
        name: this.job.name,
      },
      userId: match.userId,
    }))
    return Ad.TAKING_MATCH;
  }

  // }}}2
}

class Reqst extends Ad { // {{{1

  constructor (base) { // {{{2
    super(base)
    let done = this.job.userDone
    if (done) { // job done on edge, agent not required TODO sign the request
      done(this, durableObject).then(bool => {
        console.log('done bool', bool)
      })
      return;
    }
    this.status == Ad.TAKING_MATCH || this.job.requestQueue.push(this)
    console.log('new Reqst', this)
  }

  match () { // {{{2
    if (this.job.offerQueue.length == 0) {
      return null;
    }
    let offer =  this.job.offerQueue.shift()
    let ws = offer.ws
    for (let job of offer.jobs) {
      if (!job.offerQueue) {
        continue;
      }
      while (job.offerQueue.length > 0) {
        let index = job.offerQueue.findIndex(offer => offer.ws === ws)
        if (index < 0) {
          break;
        }
        job.offerQueue.splice(index, 1)
      }
    }
    console.log('Reqst.match offer.jobs', offer.jobs)
    return offer;
  }

  take (match) { // {{{2
    console.log('Reqst.take match', match)
    this.ws.send(JSON.stringify({
      agentId: match.agentId,
    }))
    return Ad.TAKING_MATCH;
  }

  // }}}2
}

const jobsHx = {}, topjobsHx = {} // {{{1
const mapOffer2Hub = new Map(), mapWs2Hubs = new Map()

class JobHub { // {{{1
  constructor (jobs, jobname, hub) { // {{{2
    this.passthrough = []
    jobs[jobname] ??= []
    let job = jobs[jobname][0]
    const agentAuth = _ => { // {{{3
      let agentId = hub.jobAgentId
      let agent = jobs === jobsHx ? hxSvc[agentId] : hxTopSvc[agentId]
      if (agent) {
        let job = agent.jobs.find(e => e.name == jobname)
        return job.agentAuth(hub.pk, durableObject.env);
      }
      throw Error('Not Found')
    }

    const prefix = (myId, agentId) => { // {{{3
      return myId ? `${myId} AM` : `AGENT ${agentId} IS`;
    }

    const userAuth = _ => { // {{{3
      let agents = jobs === jobsHx ? hxSvc : hxTopSvc
      for (let jobAgentId of Object.getOwnPropertyNames(agents)) {
        let job = agents[jobAgentId].jobs.find(e => e.name == jobname)
        if (job.userAuth(hub.pk, durableObject.env)) {
          //console.log('new JobHub userAuth job', job)

          return job;
        }
      }
      throw Error('Not Authorized')
    }

    if (hub.jobAgentId) { // job offer {{{3
      agentAuth()
      hub.taking = +0
    } else {              // job request
      let done = userAuth().userDone
      if (done) { // job done on edge, agent not required
        done(hub, durableObject).then(bool => {
          console.log('done bool', bool)
          hub.ws.send('DONE ' + bool)
        })
        return;
      }
      if (jobs[jobname].length > 0) {
        job.taking = +0
      }
    }
    if (jobs[jobname].length == 0 || job.jobAgentId && hub.jobAgentId || !hub.jobAgentId && !job.jobAgentId) { // same side {{{3
      jobs[jobname].push(this)
    } else {                                                                                                   // taking an opposite side
      hub.isClosed || hub.ws.send(`${prefix(hub.jobAgentId, job.jobAgentId)} TAKING JOB ${jobname}`)
      job.isClosed || job.ws.send(`${prefix(job.jobAgentId, hub.jobAgentId)} TAKING JOB ${jobname}`)
    }

    // }}}3
    Object.assign(this, hub, { jobname, jobs })
    //mapWs2Hub.set(this.ws, this)
    this.#add2maps()
    console.log('new JobHub this', this)
  }

  #add2maps () { // {{{2
    let hubs = mapWs2Hubs.get(this.ws) ?? []
    hubs.push(this)
    mapWs2Hubs.set(this.ws, hubs)
    if (!this.jobAgentId) {
      return;
    }
    let offer = { ws: this.ws, jobAgentId: this.jobAgentId, jobname: this.jobname }
    mapOffer2Hub.set(offer, this)
  }

  jobStart (jobname) { // {{{2
    this.jobname = jobname
    console.log('JobHub jobStart this', this)
    this.ws.send(`START JOB ${this.jobname}`)
    for (let hub of this.passthrough) {
      this.jobname == hub.jobname && hub.ws.send(`AGENT ${this.jobAgentId} STARTED JOB ${this.jobname}`)
    }
  }

  pipe (data) { // {{{2
    console.log('JobHub pipe this', this, 'data', data)
    for (let hub of this.passthrough) {
      this.jobname == hub.jobname && hub.ws.send(data)
    }
  }

  // }}}2
}

const JobFairImpl = { // {{{1
  dispatch: function (request, env_OR_ws, ctx_OR_null = null) { // {{{2
    let url = new URL(request.url)
    let agent = url.pathname.startsWith('/jag')
    if (ctx_OR_null) { // EDGE
      let ctx = ctx_OR_null, env = env_OR_ws
      if (agent) {
        return addOffer(request, env, ctx, );
      } else {
        return addReqst(request, env, ctx, url.pathname);
      }
    }
    durableObject ??= this
    let parms = new URLSearchParams(url.search)
    console.log('-----------------------------')
    console.log('JobFairImpl.dispatch pathname', url.pathname, 'parms', parms)
    let ws = env_OR_ws
    let actor_id = actorId(request.cf.tlsClientAuth.certSubjectDN) 
    let path = url.pathname.split('/')
    if (agent) {
      let topSvc = url.pathname.startsWith('/jag/hx/top') // FIXME hx hardcoded
      let pk = decodeURIComponent(path[topSvc ? 5 : 4])
      addOfferDO(ws, path, pk, parms, topSvc, actor_id)
    } else {
      let pk = decodeURIComponent(path[5])
      addReqstDO(ws, path, pk, parms, actor_id)
    }
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

function addOffer (request, env, ctx) { // {{{1
  let stub = env.KOT_DO.get(env.KOT_DO_WSH_ID)
  return stub.fetch(request);
}

function addReqstDO (ws, path, pk, parms, userId) { // {{{1
  let jobname = path[3]
  let svcId = path[4]
  switch (path[1] + '/' + path[2]) {
    case 'jcl/hx':
      for (let job of hxTopSvc[svcId].jobs) {
        if (job.name == jobname) {
          job.userAuth(pk, durableObject.env)
          return new Reqst({ job, parms, path, pk, userId, ws, });
        }
      }
    case 'job/hx':
      for (let job of hxSvc[svcId].jobs) {
        if (job.name == jobname) {
          job.userAuth(pk, durableObject.env)
          return new Reqst({ job, parms, path, pk, ws, });
        }
      }
    default:
      throw Error(path);
  }
}

function addOfferDO (ws, path, pk, parms, topSvc, agentId) { // {{{1
  let svc = topSvc ? hxTopSvc : hxSvc
  let svcId = path[topSvc ? 4 : 3]
  let jobs = svc[svcId].jobs
  for (let job of jobs) {
    if (job.agentAuth) {
      job.agentAuth(pk, durableObject.env)
      let offer = new Offer({ agentId, job, jobs, parms, pk, ws, })
      if (offer.status == Ad.TAKING_MATCH) {
        break
      }
    }
  }
}

function agentHub (jobAgentId, jobname) { // {{{1
  const iterator = mapWs2Hub[Symbol.iterator]()
  for (const item of iterator) {
    console.log('agentHub jobname', jobname, 'item', item)

    if (item[1].jobAgentId == jobAgentId && item[1].jobname == jobname) {
      return item[1];
    }
  }
  throw Error('UNEXPECTED');
}

function actorId (certSubjectDN) { // {{{1
  if (certSubjectDN.length == 0) {
    return 'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ'; // local dev
  } //      ....:....1....:....2....:....3....:....4....:....5....:.
  let index = certSubjectDN.indexOf('OU=') + 3
  return certSubjectDN.slice(index, index + 56);
}

export { JobFairImpl, } // {{{1

