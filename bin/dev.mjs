#!/usr/bin/env node

import fs from 'fs' // {{{1
import { 
  configuration,
  hack, post_jcl, post_job, 
  promiseWithResolvers,
  put_agent, setkeys,
} from '../cloudflare-job-fair/lib/jf3.mjs'
import { hx_use_tm, } from '../lib/util.mjs'

Object.assign(configuration, promiseWithResolvers()) // {{{1

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
