#!/usr/bin/env node

import path from 'path'; // {{{1
import fs from 'fs';
import https from 'https';
import fetch from 'node-fetch';
import { jagURLparameters, jobURLparameters, } from '../cloudflare-job-fair/lib/util.mjs'

const execute = { // {{{1
  post_job: async (node, run, cmd, ...args) => { // {{{2
    console.log('- args', args)
    let parameters = jobURLparameters(args)
    fetch(`http://127.0.0.1:8787/job${parameters}`).
      then(response => response.text()).then(responseBody => console.log(responseBody)).catch(err => console.log(err))
    //fetch('https://job.kloudoftrust.org', { method: 'POST', body: args[0], }).then(response => console.log(response)) //response.text()).
    //then(responseBody => console.log(responseBody)).catch(err => console.log(err))
  },
  put_agent: async (node, run, cmd, ...args) => { // {{{2
    console.log('- args', args)
    let parameters = jagURLparameters(args)
    fetch(`http://127.0.0.1:8787/jag${parameters}`).
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
