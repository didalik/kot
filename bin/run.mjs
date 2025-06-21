#!/usr/bin/env node

import path from 'path'; // {{{1
import fs from 'fs';
import https from 'https';
import fetch from 'node-fetch';
import os from 'os'

const reqUrl = 'https://jag.kloudoftrust.org/cf'; // {{{1
const mTLS_private_key_key = `${os.homedir()}/.cloudflare-job-fair/jag/certificate.key`
const mTLS_public_cert_pem = `${os.homedir()}/.cloudflare-job-fair/jag/certificate.pem`

const options = {
  cert: fs.readFileSync(mTLS_public_cert_pem, 'utf-8',),
  key: fs.readFileSync(mTLS_private_key_key, 'utf-8',),
  keepAlive: false, // switch to true if you're making a lot of calls from this client
};


const execute = { // {{{1
  post_job: async (node, run, cmd, ...args) => { // {{{2
    console.log('- args', args)
    fetch('https://job.kloudoftrust.org/job').
      then(response => response.text()).then(responseBody => console.log(responseBody)).catch(err => console.log(err))
    //fetch('https://job.kloudoftrust.org', { method: 'POST', body: args[0], }).then(response => console.log(response)) //response.text()).
    //then(responseBody => console.log(responseBody)).catch(err => console.log(err))
  },
  put_agent: async (node, run, cmd, ...args) => { // {{{2
    console.log('- args', args)
    fetch('https://jag.kloudoftrust.org/jag', { agent: new https.Agent(options), }).
      then(response => response.text()).then(responseBody => console.log(responseBody)).catch(err => console.log(err))
    //fetch(args[0], { method: 'PUT', body: args[1], }).then(response => console.log(response)) //response.text()).
    //then(responseBody => console.log(responseBody)).catch(err => console.log(err))
  },
  // }}}2
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
