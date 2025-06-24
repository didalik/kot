const JobFairImpl = { // EDGE {{{1
  add: (request, env, ctx, pp, ) => {
    let { readable, writable } = new TransformStream();
    let url = new URL(request.url)
    return new Response(pp(JSON.parse(url.searchParams.get('json'))));
  }
}

export { JobFairImpl, }
