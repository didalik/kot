#!/usr/bin/env node

import { reset, } // {{{1
from '../../../../../../public/lib/sdk.mjs' // FIXME
import * as fs from "node:fs"

let s = {}, e = { log: console.log }, c = { fs }, d = {} // {{{1
let vm = { s, e, c, d }

await reset.call(vm, process.argv[2]).then(_ => process.exit(0)). // {{{1
  catch(err => {
    console.error(err)
    process.exit(1)
  });
