import * as jobHxAgents from '../module-job-hx-agent/src/list.js' // {{{1
//import * as jobHxDeclarations from '../module-job-hx-agent/src/module-job-hx-declaration/list.js'
import * as topjobHxAgents from '../module-topjob-hx-agent/src/list.js'

let durableObject; // {{{1
const jobsHx = { _set: 'jobsHx', }, topjobsHx = { _set: 'topjobsHx', }

class JobHub { // {{{1
  constructor (jobs, jobname, hub) { // {{{2
    jobs[jobname] ??= []
    const agentId = _ => {
      let agentId = jobs[jobname][0].jobAgentId
      let agent = jobs === jobsHx ? jobHxAgents[agentId] : topjobHxAgents[agentId]
      agent.drop(jobs[jobname])
      return agentId;
    }
    const push = _ => {
      /*
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
      */
      Object.assign(this, hub)
      jobs[jobname].push(this)
    }
    if (jobs[jobname].length == 0) {
      push()
    } else {
      if (jobs[jobname][0].jobAgentId && hub.jobAgentId || !hub.jobAgentId && !jobs[jobname][0].jobAgentId) {
        push()
      } else {
        hub.ws.send(`${hub.jobAgentId} TAKING JOB ${jobname}`)
        jobs[jobname][0].ws.send(`${jobs[jobname][0].jobAgentId} TAKING JOB ${jobname}`)
        let jobAgentId = hub.jobAgentId ?? agentId()
        console.log('new JobHub agent', jobAgentId, 'is taking jobname', jobname)
      }
    }
    console.log('new JobHub jobs', jobs)
  }

  // }}}2
}

const JobFairImpl = { // {{{1
  addJob: (request, env, ctx, ) => { // {{{2
    if (env.URL_PATHNAME == '/hack/do0') { // DONE
      try {
        let stub = env.KOT_DO.get(env.KOT_DO.idFromName('JobFair webSocket with Hibernation'))
        return stub.deleteAll().then(r => new Response(`- stub.deleteAll ${r}`));
      }
      catch (err) {
        return new Response(`${err}`);
      }
    }
    let stub = env.KOT_DO.get(env.KOT_DO_WSH_ID)
    delete env.jobAgentId
    return stub.fetch(request);
  },

  addJobAgent: (request, env, ctx, ) => { // {{{2
    let stub = env.KOT_DO.get(env.KOT_DO_WSH_ID)
    env.jobAgentId = agentId(request.cf.tlsClientAuth.certSubjectDN) 
    return stub.fetch(request);
  },

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
  }

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

