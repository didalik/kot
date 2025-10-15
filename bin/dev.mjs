#!/usr/bin/env node

import path from 'path'; // {{{1
import { 
  configuration,
  hack, post_jcl, post_job, 
  promiseWithResolvers,
  put_agent, setkeys, start_testnet_monitor,
} from '../cloudflare-job-fair/lib/jf3.mjs'

Object.assign(configuration, promiseWithResolvers())

const execute = { // {{{1
  hack, post_jcl, post_job, put_agent, setkeys, start_testnet_monitor,
}

switch (process.argv[2]) { // {{{1
  default: // {{{2
    console.log('execute', process.argv[2])
    await execute[process.argv[2]](...process.argv)
    console.log('started', process.argv[2])

    // }}}2
}
