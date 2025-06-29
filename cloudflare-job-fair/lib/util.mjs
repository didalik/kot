import fetch from 'node-fetch' // // CLIENT {{{1

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

function log (...args) { // CLIENT {{{1
  console.log(...args)
}

async function post_jcl (node, run, cmd, ...args) { // CLIENT {{{1
  let parameters = jclURLparameters(args)
  let urlJcl = process.env._ == 'bin/dev.mjs' ? 'http://127.0.0.1:8787/jcl'
    : 'https://jag.kloudoftrust.org/jcl'
  let url = `${urlJcl}${parameters}`
  log('- post_jcl args', args, 'url', url, 'configuration', configuration)
  fetch(url, configuration.fetch_options ?? {}).then(response => response.text()).
    then(responseBody => console.log(responseBody)).catch(err => console.log(err))
}

async function post_job (node, run, cmd, ...args) { // CLIENT {{{1
  let parameters = jobURLparameters(args)
  let urlJob = process.env._ == 'bin/dev.mjs' ? 'http://127.0.0.1:8787/job'
    : 'https://job.kloudoftrust.org/job'
  let url = `${urlJob}${parameters}`
  log('- post_job args', args, 'url', url, 'configuration', configuration)
  fetch(url, configuration.fetch_options ?? {}).then(response => response.text()).
    then(responseBody => console.log(responseBody)).
    catch(err => console.log(err))
}

async function put_agent (node, run, cmd, ...args) { // CLIENT {{{1
  let parameters = jagURLparameters(args)
  let urlJag = process.env._ == 'bin/dev.mjs' ? 'http://127.0.0.1:8787/jag'
    : 'https://jag.kloudoftrust.org/jag'
  let url = `${urlJag}${parameters}`
  log('- put_agent args', args, 'url', url, 'configuration', configuration)
  fetch(url, configuration.fetch_options ?? {}).then(response => response.text()).
    then(responseBody => console.log(responseBody)).
    catch(err => console.log(err))
}

export { configuration, post_jcl, post_job, put_agent, } // {{{1

