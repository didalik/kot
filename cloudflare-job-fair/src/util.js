const JobFairImpl = { // EDGE {{{1
  addJob: (request, env, ctx, ) => { // {{{2
    let stub = env.KOT_DO.get(env.KOT_DO_WSH_ID)
    return stub.fetch(request);
  },

  addJobAgent: (request, env, ctx, ) => { // {{{2
    let stub = env.KOT_DO.get(env.KOT_DO_WSH_ID)
    let jobAgentId = request.url.startsWith('https://') ? agentPK(request.cf.tlsClientAuth.certSubjectDN) 
      : 'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ' // local dev
    //   ....:....1....:....2....:....3....:....4....:....5....:.
    return stub.delete('JOB_AGENT_ID').then(_ => stub.put('JOB_AGENT_ID', jobAgentId)).then(_ => stub.fetch(request));
  },

  // }}}2
}

function agentPK (certSubjectDN) { // {{{1
  let index = certSubjectDN.indexOf('OU=') + 3
  return certSubjectDN.slice(index, index + 56);
}

export { JobFairImpl, } // {{{1

