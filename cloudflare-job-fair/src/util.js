const JobFairDOImpl = { // Durable Object {{{1
  addJobAgent: id => { // {{{2
    console.log('JobFairDOImpl.addJobAgent id', id)
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

