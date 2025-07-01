const JobFairImpl = { // EDGE {{{1
  add: (request, env, ctx, pp, ) => {
    /*
    let { readable, writable } = new TransformStream();
    let url = new URL(request.url)
    return new Response(pp(JSON.parse(url.searchParams.get('json'))));
    */
    if (!env.KOT_DO_WSH_ID) {
      env.KOT_DO_WSH_ID = env.KOT_DO.idFromName('JobFair webSocket with Hibernation')
    }
    let stub = env.KOT_DO.get(env.KOT_DO_WSH_ID)
    return stub.delete('JOB_AGENT_ID').then(_ => stub.put('JOB_AGENT_ID', JSON.stringify(request.cf.tlsClientAuth))).then(_ => stub.fetch(request)); // FIXME
  }
}

export { JobFairImpl, }
