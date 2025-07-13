import * as jobHxAgents from '../module-job-hx-agent/src/list.js' // {{{1
//import * as jobHxDeclarations from '../module-job-hx-agent/src/module-job-hx-declaration/list.js'
import * as topjobHxAgents from '../module-topjob-hx-agent/src/list.js'

let durableObject; // {{{1
const jobsHx = { _set: 'jobsHx', }, mapWs2Hub = new Map(), topjobsHx = { _set: 'topjobsHx', }
const base64ToUint8 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
const uint8ToBase64 = (arr) => Buffer.from(arr).toString('base64')

class JobHub { // {{{1
  constructor (jobs, jobname, hub) { // {{{2
    jobs[jobname] ??= []
    const agentId = _ => { // {{{3
      let agentId = jobs[jobname][0].jobAgentId
      let agent = jobs === jobsHx ? jobHxAgents[agentId] : topjobHxAgents[agentId]
      agent.drop(jobs[jobname])
      return agentId;
    }
    const prefix = (myId, agentId) => { // {{{3
      return myId ? 'I AM' : `AGENT ${agentId} IS`;
    }
    const push = _ => { // {{{3
      /*
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
      */
      jobs[jobname].push(this)
    } // }}}3
    Object.assign(this, hub)
    if (jobs[jobname].length == 0) {
      push()
    } else {
      if (jobs[jobname][0].jobAgentId && hub.jobAgentId || !hub.jobAgentId && !jobs[jobname][0].jobAgentId) {
        push()
      } else {
        hub.ws.send(`${prefix(hub.jobAgentId, jobs[jobname][0].jobAgentId)} TAKING JOB ${jobname}`)
        jobs[jobname][0].ws.send(`${prefix(jobs[jobname][0].jobAgentId, hub.jobAgentId)} TAKING JOB ${jobname}`)
        let jobAgentId = hub.jobAgentId ?? agentId() // FIXME
        //console.log('new JobHub agent', jobAgentId, 'is taking jobname', jobname)
      }
    }
    mapWs2Hub.set(this.ws, this)
    //console.log('new JobHub jobs', jobs, 'mapWs2Hub', mapWs2Hub)
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
          console.log('JobFairImpl.wsDispatch', hub.jobAgentId, 'r', r, 'payload', signedData(json.payload64))
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

function agentId (certSubjectDN) { // {{{1
  if (certSubjectDN.length == 0) {
    return 'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ'; // local dev
  } //      ....:....1....:....2....:....3....:....4....:....5....:.
  let index = certSubjectDN.indexOf('OU=') + 3
  return certSubjectDN.slice(index, index + 56);
}

export { JobFairImpl, } // {{{1

