#!/usr/bin/env node

import { // {{{1
  addMA_Agent, addMA_CREATOR, addMA_Issuer,
  loadKeys, secdVm,
} from '../../../../../../public/lib/sdk.mjs' // FIXME
import { 
  HEX_FEE, 
} from '../../../../../../public/lib/api.mjs' // FIXME
import * as fs from "node:fs"
import { Asset, } from '@stellar/stellar-sdk'
/*
  f_add_hex_makes: async (node, run, job, nwdir, limit) => { // {{{2
    let url = 'https://github.com/didalik/stellar-help-exchange/blob/main/README.md'
    r = await makeRequest.call(vm, // = Port Angeles = {{{3
      vm.d.agent, Keypair.fromSecret(vm.d.keysAgent[0]),
      requestPARTNERS_WELCOME(url)   // Port Angeles //////
    )
    makeIds = makeIds + r.txId + ' '
    log('- f_add_hex_makes makeRequest', r.request, r.amount, r.balanceId, r.txId)

    r = await makeRequest.call(vm, // = Tagoba = {{{3
      vm.d.agent, Keypair.fromSecret(vm.d.keysAgent[0]),
      requestHELP_WANTED(url)        // Tagoba ////////////
    )
    makeIds = makeIds + r.txId + ' '
    log('- f_add_hex_makes makeRequest', r.request, r.amount, r.balanceId, r.txId)
    
    r = await makeOffer.call(vm, //   = Kyiv = {{{3
      vm.d.agent, Keypair.fromSecret(vm.d.keysAgent[0]),
      offerAIM_FOR_BUSINESSES(url)   // Kyiv //////////////
    )
    makeIds = makeIds + r.txId + ' '
    log('- f_add_hex_makes makeOffer', r.offer, r.balanceId, r.txId)

    r = await makeRequest.call(vm, // = Aukland = {{{3
      vm.d.agent, Keypair.fromSecret(vm.d.keysAgent[0]),
      requestAGENTS_WANTED(url)     // Aukland ///////////
    )
    makeIds = makeIds + r.txId // Look, Ma! NO SPACE!
    log('- f_add_hex_makes makeRequest', r.request, r.amount, r.balanceId, r.txId)
    // }}}3
    fs.writeFileSync(nwdir + '/HEX_Agent_make2map.txids', makeIds)
  },
*/
async function setup_selftest (limit, nwdir) { // {{{1
  let agent_keys = nwdir + '/HEX_Agent.keys'
  let creator_keys = nwdir + '.keys'
  let keys = nwdir + '/HEX_Issuer.keys'
  let log = console.log
  let vm = await secdVm(
    loadKeys(fs, keys),       // keysIssuer
    loadKeys(fs, agent_keys), // keysAgent
    log, limit, HEX_FEE, nwdir.endsWith('public'), null, fs
  )
  console.log('setup_selftest nwdir', nwdir, 'vm', vm)
}

await setup_selftest(process.argv[2], process.argv[3]).then(_ => process.exit(0)). // {{{1
  catch(err => {
    console.error(err)
    process.exit(1)
  });

