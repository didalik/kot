#!/usr/bin/env node

import path from 'path'; // {{{1
import { 
  hack, post_jcl, post_job, put_agent, start_testnet_monitor,
} from '../cloudflare-job-fair/lib/jf1.mjs'

const execute = { // {{{1
  hack, post_jcl, post_job, put_agent, start_testnet_monitor,
}

switch (process.argv[2]) { // {{{1
  default: // {{{2
    console.log('execute', process.argv[2])
    await execute[process.argv[2]](...process.argv)
    console.log('started', process.argv[2])

    // }}}2
}
