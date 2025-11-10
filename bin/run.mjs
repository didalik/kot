#!/usr/bin/env node

import path from 'path'; // {{{1
import fs from 'fs';
import https from 'https';
import os from 'os'
import {
  configuration, hack, post_jcl, post_job, 
  promiseWithResolvers,
  put_agent, setkeys,
} from '../cloudflare-job-fair/lib/jf3.mjs'
import { hx_use_tm, } from '../lib/util.mjs'

const mTLS_private_key // {{{1
  = `${os.homedir()}/.cloudflare-job-fair/jag/certificate.key`
const mTLS_public_cert_pem 
  = `${os.homedir()}/.cloudflare-job-fair/jag/certificate.pem`

const options = {
  cert: fs.readFileSync(mTLS_public_cert_pem, 'utf-8',),
  key: fs.readFileSync(mTLS_private_key, 'utf-8',),
  keepAlive: false,
};

Object.assign(configuration, {
  fetch_options: { agent: new https.Agent(options), },
}, promiseWithResolvers())

const execute = { // {{{1
  hack, hx_use_tm, post_jcl, post_job, put_agent, setkeys,
}

switch (process.argv[2]) { // {{{1
  default: // {{{2
    console.log('execute', process.argv[2])
    await execute[process.argv[2]](...process.argv)
    console.log('started', process.argv[2])

    // }}}2
}

/** {{{1
 * Thanks to:
 * https://sebtrif.xyz/blog/2019-10-03-client-side-ssl-in-node-js-with-fetch/
 **/
