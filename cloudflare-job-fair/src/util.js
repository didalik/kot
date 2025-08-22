import * as jobHxAgents from '../module-job-hx-agent/src/list.js' // {{{1
import * as topjobHxAgents from '../module-topjob-hx-agent/src/list.js'

let durableObject; // {{{1
const jobsHx = {}, mapWs2Hub = new Map(), topjobsHx = {}
const base64ToUint8 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
const uint8ToBase64 = (arr) => Buffer.from(arr).toString('base64')

class JobHub { // {{{1
  constructor (jobs, jobname, hub) { // {{{2
    this.passthrough = []
    jobs[jobname] ??= []
    let job = jobs[jobname][0]

    console.log('new JobHub jobs', jobs, 'jobname', jobname, 'hub', hub, 'job', job)

    const agentAuth = _ => { // {{{3
      let agentId = hub.jobAgentId
      let agent = jobs === jobsHx ? jobHxAgents[agentId] : topjobHxAgents[agentId]
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
      let agents = jobs === jobsHx ? jobHxAgents : topjobHxAgents
      for (let jobAgentId of Object.getOwnPropertyNames(agents)) {
        let job = agents[jobAgentId].jobs.find(e => e.name == jobname)
        if (job.userAuth(hub.pk, durableObject.env)) {
          //console.log('new JobHub userAuth job', job)

          return job;
        }
      }
      throw Error('Not Authorized')
    }

    // }}}3
 
    if (hub.jobAgentId) { // job offer
      agentAuth()
      hub.taking = +0
    } else {              // job request
      let userDone = userAuth().userDone
      if (userDone && userDone(hub, durableObject)) {
        hub.ws.send('DONE')
        return;
      }
      if (jobs[jobname].length > 0) {
        job.taking = +0
      }
    }
    if (jobs[jobname].length == 0 || job.jobAgentId && hub.jobAgentId || !hub.jobAgentId && !job.jobAgentId) { // same side
      jobs[jobname].push(this)
    } else {                                                                                                   // taking an opposite side
      hub.isClosed || hub.ws.send(`${prefix(hub.jobAgentId, job.jobAgentId)} TAKING JOB ${jobname}`)
      job.isClosed || job.ws.send(`${prefix(job.jobAgentId, hub.jobAgentId)} TAKING JOB ${jobname}`)
    }
    Object.assign(this, hub, { jobs })
    mapWs2Hub.set(this.ws, this)
  }

  jobStart (jobname) { // {{{2
    this.jobname = jobname
    console.log('JobHub jobStart this', this)
    this.ws.send(`START JOB ${this.jobname}`)
    for (let ws of this.passthrough) {
      ws.send(`AGENT ${this.jobAgentId} STARTED JOB ${this.jobname}`)
    }
  }

  pipe (data) { // {{{2
    for (let ws of this.passthrough) {
      ws.send(data)
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
        return addJobAgent(request, env, ctx, );
      } else {
        return addJob(request, env, ctx, url.pathname);
      }
    }
    durableObject ??= this
    let parms = new URLSearchParams(url.search)
    console.log('JobFairImpl.dispatch pathname', url.pathname, 'parms', parms)
    let ws = env_OR_ws
    let jobAgentId = agentId(request.cf.tlsClientAuth.certSubjectDN) 
    let path = url.pathname.split('/')
    let pk = decodeURIComponent(path[4])
    if (agent) {
      addJobAgentDO(ws, path, pk, jobAgentId, parms)
    } else {
      addJobDO(ws, path, pk, parms)
    }
  },

  wsClose: (ws, code, reason, wasClean) => { // {{{2
    let hub = mapWs2Hub.get(ws)
    if (!hub) {
      console.log('JobFairImpl.wsClose wasClean', wasClean, 'reason', reason, 'code', code, 'closing websocket...')
      ws.close()
      return;
    }
    wasClean && ws.close()
    hub.isClosed = true
    for (let ws of hub.passthrough) {
      ws.close()
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
          if (!r) { // TODO handle verify false
            return;
          }
          if (hub.arg1) { // FIXME
            ws.send('FIXME arg1 ' + hub.arg1)
          }
          let payload = signedData(json.payload64)
          let jobname = payload.slice(payload.lastIndexOf(' ') + 1)
          let jobAgentId = hub.jobAgentId ?? payload.split(' ')[1]
          if (hub.jobAgentId) { // approval from job agent ////////////
            if (++hub.taking == 2) {
              hub.jobStart(jobname)
            }
          } else {              // approval from job user /////////////
            let jobAgentHub = agentHub(jobAgentId)
            jobAgentHub.passthrough.push(ws)
            hub.passthrough.push(jobAgentHub.ws)
            hub.jobname = jobname
            if (++jobAgentHub.taking == 2) {
              jobAgentHub.jobStart(jobname)
            }
          }
          console.log('JobFairImpl.wsDispatch r', r, 'jobAgentId', jobAgentId, 'hub', hub)
        }).catch(err => console.log('JobFairImpl.wsDispatch *** ERROR *** err', err))
    } catch (e) {
      if (!e.toString().startsWith('SyntaxError')) {
        throw e;
      }
      console.log('JobFairImpl.wsDispatch data', data)
    } // }}}3
  },

  // }}}2
}

function addJob (request, env, ctx, pathname) { // {{{1
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

function addJobAgent (request, env, ctx) { // {{{1
  let stub = env.KOT_DO.get(env.KOT_DO_WSH_ID)
  return stub.fetch(request);
}

function addJobDO (ws, path, pk, parms) { // {{{1
  switch (path[1] + '/' + path[2]) {
    case 'jcl/hx':
      return new JobHub(topjobsHx, path[3], { parms, path, pk, ws, });
    case 'job/hx':
      return new JobHub(jobsHx, path[3], { parms, path, pk, ws, });
    default:
      throw Error(path);
  }
}

function addJobAgentDO (ws, path, pk, jobAgentId, parms) { // {{{1
  //console.log('addJobAgentDO ws', ws, 'path', path, 'pk', pk, 'jobAgentId', jobAgentId, 'parms', parms)

  switch (path[1] + '/' + path[2] + '/' + path[3]) {
    case 'jag/topjob/hx':
      for (let job of topjobHxAgents[jobAgentId].jobs) {
        job.agentAuth && new JobHub(topjobsHx, job.name, { parms, jobAgentId, pk, ws, });
      }
      break
    case 'jag/job/hx':
      for (let job of jobHxAgents[jobAgentId].jobs) {
        new JobHub(jobsHx, job.name, { parms, jobAgentId, pk, ws, });
      }
      break
    default:
      throw Error(path);
  }
}

function agentHub (jobAgentId) { // {{{1
  const iterator = mapWs2Hub[Symbol.iterator]()
  for (const item of iterator) {
    if (item[1].jobAgentId == jobAgentId) {
      return item[1];
    }
  }
  throw Error('UNEXPECTED');
}

function agentId (certSubjectDN) { // {{{1
  if (certSubjectDN.length == 0) {
    return 'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ'; // local dev
  } //      ....:....1....:....2....:....3....:....4....:....5....:.
  let index = certSubjectDN.indexOf('OU=') + 3
  return certSubjectDN.slice(index, index + 56);
}

export { JobFairImpl, } // {{{1

