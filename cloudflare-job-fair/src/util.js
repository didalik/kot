import * as jobHxAgents from '../module-job-hx-agent/src/list.js' // {{{1
//import * as jobHxDeclarations from '../module-job-hx-agent/src/module-job-hx-declaration/list.js'
import * as topjobHxAgents from '../module-topjob-hx-agent/src/list.js'

let durableObject; // {{{1
const jobsHx = { _set: 'jobsHx', }, mapWs2Hub = new Map(), topjobsHx = { _set: 'topjobsHx', }
const base64ToUint8 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
const uint8ToBase64 = (arr) => Buffer.from(arr).toString('base64')

class JobHub { // {{{1
  constructor (jobs, jobname, hub) { // {{{2
    this.passthrough = []
    jobs[jobname] ??= []
    const agentId = _ => { // {{{3
      let agentId = jobs[jobname][0].jobAgentId
      let agent = jobs === jobsHx ? jobHxAgents[agentId] : topjobHxAgents[agentId]
      agent.drop(jobs[jobname])
      return agentId;
    }
    const prefix = (myId, agentId) => { // {{{3
      return myId ? 'I AM' : `AGENT ${agentId} IS`;
    } // }}}3
    if (hub.jobAgentId) {
      hub.taking = +0
    } else if (jobs[jobname].length > 0) {
      jobs[jobname][0].taking = +0
    }
    if (jobs[jobname].length == 0 || jobs[jobname][0].jobAgentId && hub.jobAgentId || !hub.jobAgentId && !jobs[jobname][0].jobAgentId) { // same side
      jobs[jobname].push(this)
    } else { // taking
      hub.ws.send(`${prefix(hub.jobAgentId, jobs[jobname][0].jobAgentId)} TAKING JOB ${jobname}`)
      jobs[jobname][0].ws.send(`${prefix(jobs[jobname][0].jobAgentId, hub.jobAgentId)} TAKING JOB ${jobname}`)
    }
    Object.assign(this, hub, { jobs })
    mapWs2Hub.set(this.ws, this)
  }

  jobStart (jobname) { // {{{2
    this.jobname = jobname
    console.log('JobHub jobStart this', this)
    this.ws.send(`START JOB ${this.jobname}`)
  }

  // }}}2
}

const JobFairImpl = { // {{{1
  dispatch: function (request, env_OR_ws, ctx_OR_null = null) { // {{{2
    let pathname = new URL(request.url).pathname
    let agent = pathname.startsWith('/jag')
    if (ctx_OR_null) { // EDGE
      let ctx = ctx_OR_null, env = env_OR_ws
      if (agent) {
        return addJobAgent(request, env, ctx, );
      } else {
        return addJob(request, env, ctx, pathname);
      }
    }
    durableObject ??= this
    let ws = env_OR_ws
    let jobAgentId = agentId(request.cf.tlsClientAuth.certSubjectDN) 
    let path = pathname.split('/')
    let pk = decodeURIComponent(path[4])
    if (agent) {
      addJobAgentDO(ws, path, pk, jobAgentId)
    } else {
      addJobDO(ws, path, pk)
    }
  },

  wsDispatch: (data, ws) => { // {{{2
    let hub = mapWs2Hub.get(ws)
    try {
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
          let payload = signedData(json.payload64)
          let jobname = payload.slice(payload.lastIndexOf(' ') + 1)
          let jobAgentId = hub.jobAgentId ?? payload.split(' ')[1]
          if (hub.jobAgentId) {
            if (++hub.taking == 2) {
              hub.jobStart(jobname)
            }
          } else {
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
    }
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

function addJobDO (ws, path, pk) { // {{{1
  switch (path[1] + '/' + path[2]) {
    case 'jcl/hx':
      return new JobHub(topjobsHx, path[3], { pk, ws, });
    case 'job/hx':
      return new JobHub(jobsHx, path[3], { pk, ws, });
    default:
      throw Error(path);
  }
}

function addJobAgentDO (ws, path, pk, jobAgentId) { // {{{1
  switch (path[1] + '/' + path[2] + '/' + path[3]) {
    case 'jag/topjob/hx':
      for (let job of topjobHxAgents[jobAgentId].jobs) {
        new JobHub(topjobsHx, job.name, { jobAgentId, pk, ws, });
      }
      break
    case 'jag/job/hx':
      for (let job of jobHxAgents[jobAgentId].jobs) {
        new JobHub(jobsHx, job.name, { jobAgentId, pk, ws, });
      }
      break
    default:
      throw Error(pathname);
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

