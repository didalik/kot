#!/usr/bin/env node

import { addMA_Agent, addMA_CREATOR, addMA_Issuer, } // {{{1
from '../../../../../../public/lib/sdk.mjs' // FIXME
import * as fs from "node:fs"
import { Asset, } from '@stellar/stellar-sdk'

function reset (amountMA, nwdir) { // {{{1
  console.log('reset amountMA', amountMA, 'nwdir', nwdir)
  let s = {}, e = { log: console.log }, c = { fs }, d = {}
  let vm = { s, e, c, d }

  const _init = async (vm, keysI, keysA, limit) => {
    let [Issuer_SK, Issuer_PK] = keysI
    let [Agent_SK, Agent_PK] = keysA
    const MA = new Asset('MA', Issuer_PK)
    let agent = await vm.e.server.loadAccount(Agent_PK)
    vm.e.log('+ _init loaded agent', agent.id)
    let issuer = await vm.e.server.loadAccount(Issuer_PK)
    vm.e.log('+ _init loaded issuer', issuer.id)
    Object.assign(vm.d,
      { MA, agent, keysAgent: keysA, issuer, limit }
    )
  }

  return addMA_CREATOR.call(vm, nwdir, 'monitor').
    then(kp => addMA_Issuer.call(vm, 
      'hx.kloudoftrust.org', kp, `${nwdir}/monitor`, 'Issuer'
    )).
    then(keysIssuer => addMA_Agent.call(vm,
      amountMA, keysIssuer, _init, `${nwdir}/monitor`, 'Agent'
    ));
}

await reset(process.argv[2], process.argv[3]).then(_ => process.exit(0)). // {{{1
  catch(err => {
    console.error(err)
    process.exit(1)
  });
