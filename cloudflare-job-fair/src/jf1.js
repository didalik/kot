import * as hxSvc from '../module-job-hx-agent/src/list.js' // {{{1
import * as hxTopSvc from '../module-topjob-hx-agent/src/list.js'

let durableObject; // {{{1

class Ad { // {{{1
  constructor (base) { // {{{2
    Object.assign(this, base)
    this.job.offerQueue ??= []
    this.job.requestQueue ??= []
    let match = this.match()
    if (match) {
      this.status = this.take(match)
    }
  }

  static TAKING_MATCH = +1 // {{{2

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
    return Ad.TAKING_MATCH;
  }

  // }}}2
}

class Request extends Ad { // {{{1

  constructor (base) { // {{{2
    super(base)
    this.status == Ad.TAKING_MATCH || this.job.requestQueue.push(this)
    console.log('new Request', this)
  }

  match () { // {{{2
    return this.job.offerQueue.shift();
  }

  take (match) { // {{{2
    return Ad.TAKING_MATCH;
  }

  // }}}2
}

const jobsHx = {}, topjobsHx = {} // {{{1
const mapOffer2Hub = new Map(), mapWs2Hubs = new Map()
const base64ToUint8 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
const uint8ToBase64 = (arr) => Buffer.from(arr).toString('base64')

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
        return addRequest(request, env, ctx, url.pathname);
      }
    }
    durableObject ??= this
    let parms = new URLSearchParams(url.search)
    console.log('---');console.log('JobFairImpl.dispatch pathname', url.pathname, 'parms', parms)
    let ws = env_OR_ws
    let actor_id = actorId(request.cf.tlsClientAuth.certSubjectDN) 
    let path = url.pathname.split('/')
    if (agent) {
      let topSvc = url.pathname.startsWith('/jag/hx/top') // FIXME hx hardcoded
      let pk = decodeURIComponent(path[topSvc ? 5 : 4])
      addOfferDO(ws, path, pk, parms, topSvc, actor_id)
    } else {
      let pk = decodeURIComponent(path[5])
      addRequestDO(ws, path, pk, parms, actor_id)
    }
  },

  wsClose: (ws, code, reason, wasClean) => { // the remote side of this ws has been closed {{{2

    ws.close() // our side of this ws

    let hubs = mapWs2Hubs.get(ws)
    for (let hub of mapWs2Hubs.get(ws)) {
      hub.isClosed = true
    }
    mapWs2Hubs.delete(ws)

    const iterator = mapOffer2Hub[Symbol.iterator]()
    for (const pair of iterator) {
      if (!(pair[0].ws === ws)) {
        continue;
      }
      mapOffer2Hub.delete(pair[0])
    }
    /* {{{3
    //let hub = mapWs2Hub.get(ws)
    let hubs = mapWs2Hubs.get(ws)
    if (!hubs) {
      console.log('JobFairImpl.wsClose wasClean', wasClean, 'reason', reason, 'code', code, 'closing websocket...')
      ws.close()
      return;
    }
    wasClean && ws.close()
    hub.isClosed = true
    for (let h of hub.passthrough) {
      hub.jobname == h.jobname && h.ws.close()
    }
    let jobs = hub.jobs[hub.jobname]
    jobs[0] === hub && jobs.shift()
    if (hub.jobAgentId) {
      for (let jobq of Object.getOwnPropertyNames(hub.jobs)) {
        hub.jobs[jobq].length > 0 && hub.jobs[jobq].shift()
      }
    }
    let deleted = mapWs2Hub.delete(ws)
    console.log('JobFairImpl.wsClose hub', hub, 'deleted', deleted)
    */
    // }}}3
  },

  wsDispatch: (data, ws) => { // {{{2
    let hub = mapWs2Hub.get(ws)
    if (hub.taking == 2) { // {{{3
      return hub.pipe(data);
    }
    try { // {{{3
      let json = JSON.parse(data)
      let a = base64ToUint8(hub.pk)
      let signature = base64ToUint8(json.sig64)
      let signedData = data => base64ToUint8(data).toString().split(',').reduce((s, c) => s + String.fromCodePoint(c), '')
      crypto.subtle.importKey('raw', a.buffer, 'Ed25519', true, ['verify']).
        then(pk => crypto.subtle.verify('Ed25519', pk, signature, new TextEncoder().encode(json.payload64))).
        then(r => {
          if (!r) { // TODO handle verify false - no approval
            return;
          }
          let payload = signedData(json.payload64)
          let jobname = payload.slice(payload.lastIndexOf(' ') + 1)
          let jobAgentId = hub.jobAgentId ?? payload.split(' ')[1]
          if (hub.jobAgentId) { // approval from job agent ////////////
            if (++hub.taking == 2) {
              hub.jobStart(jobname)
            }
          } else {              // approval from job user /////////////
            let jobAgentHub = agentHub(jobAgentId, jobname)
            jobAgentHub.passthrough.push(hub)
            hub.passthrough.push(jobAgentHub)
            hub.jobname = jobname
            if (++jobAgentHub.taking == 2) {
              jobAgentHub.jobStart(jobname)
            }
          }
          //console.log('JobFairImpl.wsDispatch r', r, 'jobAgentId', jobAgentId, 'hub', hub)
        }).catch(err => console.log('JobFairImpl.wsDispatch *** ERROR *** err', err))
    } catch (e) {
      if (!e.toString().startsWith('SyntaxError')) {
        throw e;
      }
      let str = data.toString()
      if (str == '[object ArrayBuffer]') {
        str = new TextDecoder('utf-8').decode(data)
      }
      console.log('JobFairImpl.wsDispatch e', e, 'str', str)
    } // }}}3
  },

  // }}}2
}

function addRequest (request, env, ctx, pathname) { // {{{1
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

function addRequestDO (ws, path, pk, parms, userId) { // {{{1
  let jobname = path[3]
  let svcId = path[4]
  switch (path[1] + '/' + path[2]) {
    case 'jcl/hx':
      for (let job of hxTopSvc[svcId].jobs) {
        if (job.name == jobname) {
          return new Request({ job, parms, /*path,*/ pk, userId, ws, }); // TODO get rid of path here
        }
      }
    case 'job/hx':
      for (let job of hxSvc[svcId].jobs) {
        if (job.name == jobname) {
          return new Request({ job, parms, /*path,*/ pk, ws, }); // TODO get rid of path here
        }
      }
    default:
      throw Error(path);
  }
}

function addOfferDO (ws, path, pk, parms, topSvc, agentId) { // {{{1
  let svc = topSvc ? hxTopSvc : hxSvc
  let svcId = path[topSvc ? 4 : 3]
  for (let job of svc[svcId].jobs) {
    job.agentAuth && new Offer({ agentId, job, parms, /*path,*/ pk, ws, }); // TODO get rid of path here
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

