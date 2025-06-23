import fetch from 'node-fetch' // // CLIENT {{{1

const JobFairImpl = { // EDGE {{{1
  add: (request, env, ctx, pp, ) => {
    let { readable, writable } = new TransformStream();
    let url = new URL(request.url)
    return new Response(pp(JSON.parse(url.searchParams.get('json'))));
  }
}

const configuration = {} // CLIENT {{{1

function jagURLparameters (args) { // CLIENT {{{1
  return '?json={"XA":"XO"}';
}

function jclURLparameters (args) { // CLIENT {{{1
  return '?json={"XA":"XO"}';
}

function jobURLparameters (args) { // CLIENT {{{1
  return '?json={"XA":"XO"}';
}

async function post_jcl (node, run, cmd, ...args) { // CLIENT {{{1
  let parameters = jclURLparameters(args)
  let urlJcl = process.env._ == 'bin/dev.mjs' ? 'http://127.0.0.1:8787/jcl'
    : 'https://jag.kloudoftrust.org/jcl'
  let url = `${urlJcl}${parameters}`
  console.log('- post_jcl url', url, 'args', args, 'configuration', configuration)
  fetch(url, configuration.fetch_options ?? {}).then(response => response.text()).
    then(responseBody => console.log(responseBody)).catch(err => console.log(err))
}

export { JobFairImpl, configuration, jagURLparameters, jobURLparameters, post_jcl, } // {{{1

