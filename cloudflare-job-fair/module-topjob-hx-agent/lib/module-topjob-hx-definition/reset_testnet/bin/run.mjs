#!/usr/bin/env node

import { addHEX_Agent, addHEX_CREATOR, addHEX_Issuer, } // {{{1
from '../../../../../../public/lib/sdk.mjs' // FIXME
import * as fs from "node:fs"

function reset (amountHEXA) { // {{{1
  console.log('reset amountHEXA', amountHEXA)
  let s = {}, e = { log: console.log }, c = { fs }, d = {}
  let vm = { s, e, c, d }
  return addHEX_CREATOR.call(vm).
    then(_ => addHEX_Issuer.call(vm, 'hx.kloudoftrust.org')).
    then(_ => addHEX_Agent.call(vm, amountHEXA));
}

await reset(process.argv[2]).then(_ => process.exit(0)). // {{{1
  catch(err => {
    console.error(err)
    process.exit(1)
  });
