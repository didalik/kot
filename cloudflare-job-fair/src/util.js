import * as jobHxAgents from '../module-job-hx-agent/src/list.js' // {{{1
//import * as jobHxDeclarations from '../module-job-hx-agent/src/module-job-hx-declaration/list.js'
import * as topjobHxAgents from '../module-topjob-hx-agent/src/list.js'

const jobsHx = { _set: 'jobsHx', }, topjobsHx = { _set: 'topjobsHx', } // Durable Object {{{1

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

const JobFairDOImpl = { // Durable Object {{{1
  addJob: env => { // {{{2
    let path = env.URL_PATHNAME.split('/')
    //console.log('JobFairDOImpl.addJob path', path)
    switch (path[1] + path[2]) {
      case 'jclhx':
        return new JobHub(topjobsHx, path[3], { ws: env.ws, });
      case 'jobhx':
        return new JobHub(jobsHx, path[3], { ws: env.ws, });
      default:
        throw Error(path);
    }
  },

  addJobAgent: env => { // {{{2
    //console.log('JobFairDOImpl.addJobAgent env', env)
    switch (env.URL_PATHNAME) {
      case '/jag/topjob/hx':
        for (let job of topjobHxAgents[env.jobAgentId].jobs) {
          new JobHub(topjobsHx, job.name, { jobAgentId: env.jobAgentId, ws: env.ws, });
        }
        return true;
      case '/jag/job/hx':
        for (let job of jobHxAgents[env.jobAgentId].jobs) {
          new JobHub(jobsHx, job.name, { jobAgentId: env.jobAgentId, ws: env.ws, });
        }
        return true;
      default:
        throw Error(env.URL_PATHNAME);
    }
  },

  // }}}2
}

const JobFairImpl = { // EDGE {{{1
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
    env.jobAgentId = agentPK(request.cf.tlsClientAuth.certSubjectDN) 
    return stub.fetch(request);
  },

  // }}}2
}

function agentPK (certSubjectDN) { // {{{1
  if (certSubjectDN.length == 0) {
    return 'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ'; // local dev
  } //      ....:....1....:....2....:....3....:....4....:....5....:.
  let index = certSubjectDN.indexOf('OU=') + 3
  return certSubjectDN.slice(index, index + 56);
}

export { JobFairDOImpl, JobFairImpl, } // {{{1

