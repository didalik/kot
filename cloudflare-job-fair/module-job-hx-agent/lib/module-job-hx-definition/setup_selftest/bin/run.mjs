#!/usr/bin/env node

import { setup_selftest, } from '../../../../../../lib/util.mjs' // {{{1

await setup_selftest(process.argv[2], process.argv[3]). // {{{1
  then(makeIds => {
    console.log('run.mjs makeIds', makeIds)
    return Promise.resolve();
  }).
  then(_ => process.exit(0)).
  catch(err => {
    console.error(err)
    process.exit(1)
  });

