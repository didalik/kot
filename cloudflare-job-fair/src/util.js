import * as jobHxAgents from '../module-job-hx-agent/src/list.js' // {{{1
//import * as jobHxDeclarations from '../module-job-hx-agent/src/module-job-hx-declaration/list.js'
import * as topjobHxAgents from '../module-topjob-hx-agent/src/list.js'

const jobsHx = { set: 'jobsHx', }, topjobsHx = { set: 'topjobsHx', } // Durable Object {{{1

class JobHub { // {{{1
  constructor (jobs, jobname, opts) { // {{{2
    console.log('new JobHub jobs', jobs, 'jobname', jobname, 'opts', opts)
  }

  // }}}2
}

const JobFairDOImpl = { // Durable Object {{{1
  addJob: env => { // {{{2
    let path = env.URL_PATHNAME.split('/')
    //console.log('JobFairDOImpl.addJob path', path)
    switch (path[1] + path[2]) {
      case 'jclhx':
        return new JobHub(topjobsHx, path[3], { type: 'SimpleType', });
      case 'jobhx':
        return new JobHub(jobsHx, path[3], { type: 'SimpleType', });
      default:
        throw Error(path);
    }
  },

  addJobAgent: env => { // {{{2
    //console.log('JobFairDOImpl.addJobAgent env', env)
    switch (env.URL_PATHNAME) {
      case '/jag/topjob/hx':
        for (let job of topjobHxAgents[env.jobAgentId].jobs) {
          new JobHub(topjobsHx, job.name, { kind: 'SimpleKind', });
        }
        return true;
      case '/jag/job/hx':
        for (let job of jobHxAgents[env.jobAgentId].jobs) {
          new JobHub(jobsHx, job.name, { kind: 'SimpleKind', });
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

