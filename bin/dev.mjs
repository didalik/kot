#!/usr/bin/env node

import path from 'path'; // {{{1
import fs from 'fs';
import https from 'https';
import fetch from 'node-fetch';
import os from 'os'

const reqUrl = 'https://jag.kloudoftrust.org/cf'; // {{{1
const mTLS_private_key_key = `${os.homedir()}/.cloudflare-job-fair/jag/certificate.key`
const mTLS_public_cert_pem = `${os.homedir()}/.cloudflare-job-fair/jag/certificate.pem`

const headers = {
  Accept: 'application/json',
};

async function makeRequest(url) { // {{{1
  if (url.startsWith('http:')) {
    fetch(url).then(response => response.text()).then(responseBody => console.log(responseBody)).catch(err => console.log(err))
    return;
  }
  const options = {
    cert: fs.readFileSync(mTLS_public_cert_pem, 'utf-8',),
    key: fs.readFileSync(mTLS_private_key_key, 'utf-8',),
    keepAlive: false, // switch to true if you're making a lot of calls from this client
  };

  const sslConfiguredAgent = new https.Agent(options);

  try {
    const response = await fetch(url, {
      headers: headers, // ... pass everything just as you usually would
      agent: sslConfiguredAgent, // ... but add the agent we initialised
    });
    const responseBody = await response.text();
    console.log(responseBody);
  } catch (error) {
    console.log(error);
  }
}
makeRequest(reqUrl);

const execute = { // {{{1
  get_job_done: async (node, run, job, ...args) => { //2
    console.log('- args', args)
    makeRequest(args[0])
  },
  post_job_agent: async (node, run, job, ...args) => { //2
    console.log('- args', args)
  },
}

switch (process.argv[2]) { // {{{1
  default: // {{{2
    console.log('execute', process.argv[2])
    await execute[process.argv[2]](...process.argv)
    console.log('executed')

    // }}}2
}

/** {{{1
 * Thanks to:
 * https://sebtrif.xyz/blog/2019-10-03-client-side-ssl-in-node-js-with-fetch/
 **/
