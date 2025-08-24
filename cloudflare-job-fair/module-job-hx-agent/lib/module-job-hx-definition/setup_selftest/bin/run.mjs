#!/usr/bin/env node

import { // {{{1
  addMA_Agent, addMA_CREATOR, addMA_Issuer,
  loadKeys, secdVm,
} from '../../../../../../public/lib/sdk.mjs' // FIXME
import { 
  HEX_FEE, makeOffer, makeRequest,
} from '../../../../../../public/lib/api.mjs' // FIXME
import * as fs from "node:fs"
import { Asset, Keypair, } from '@stellar/stellar-sdk'

function offerAIM_FOR_BUSINESSES (url) { // {{{1
  let hash = '#%D0%B4%D1%96%D0%B4-alik--the-kids-aim-for-businesses'
  return `<b>Did Alik & the Kids: AIM FOR BUSINESSES</b><br/>
Automated Integration Modeling by DA&K. Inquiry fee HEXA 10.
<a href='${url}${hash}' target='_blank'>More...</a>`;
}

function offerHEX_FOR_SALE (url) { // {{{1
  let hash = '#stellar-hex-for-sale'
  return `<b>Stellar HEX: FOR SALE</b><br/>
Full or partial ownership. Inquiry fee HEXA 100.
<a href='${url}${hash}' target='_blank'>More...</a>`;
}

function requestAGENTS_WANTED (url) { // {{{1
  let hash = '#stellar-hex-agents-wanted'
  return `<b>Stellar HEX: AGENTS WANTED</b><br/>
Signing bonus HEXA 10 + #(jobs run) * rate.
<a href='${url}${hash}' target='_blank'>More...</a>`;
}

function requestHELP_WANTED (url) { // {{{1
  let hash = '#stellar-hex-help-wanted'
  return `<b>Stellar HEX: HELP WANTED</b><br/>
Signing bonus HEXA 1000 + (job done) * (hourly rate).
<a href='${url}${hash}' target='_blank'>More...</a>`;
}

function requestPARTNERS_WELCOME (url) { // {{{1
  let hash = '#stellar-hex-partners-welcome'
  return `<b>Stellar HEX: PARTNERS WELCOME</b><br/>
Signing bonus HEXA 1000 + profit / 2.
<a href='${url}${hash}' target='_blank'>More...</a>`;
}

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
  //console.log('setup_selftest nwdir', nwdir, 'vm', vm)

  let url = 'https://github.com/didalik/stellar-help-exchange/blob/main/README.md'

  let r = await makeOffer.call(vm,     // = Onna = {{{2
    vm.d.agent, Keypair.fromSecret(vm.d.keysAgent[0]),
    offerHEX_FOR_SALE(url)         // Onna //////////////
  )
  let makeIds = r.txId + ' 26.4668328 127.8232348 '
  log('- f_add_hex_makes makeOffer', r.offer, r.balanceId, r.txId)

  r = await makeRequest.call(vm, // = Port Angeles = {{{2
    vm.d.agent, Keypair.fromSecret(vm.d.keysAgent[0]),
    requestPARTNERS_WELCOME(url)   // Port Angeles //////
  )
  makeIds = makeIds + r.txId + ' 48.1165763 -123.4444233 '
  log('- f_add_hex_makes makeRequest', r.request, r.amount, r.balanceId, r.txId)

  r = await makeRequest.call(vm, // = Tagoba = {{{2
    vm.d.agent, Keypair.fromSecret(vm.d.keysAgent[0]),
    requestHELP_WANTED(url)        // Tagoba ////////////
  )
  makeIds = makeIds + r.txId + ' 8.7961073 -79.5552843 '
  log('- f_add_hex_makes makeRequest', r.request, r.amount, r.balanceId, r.txId)
  
  r = await makeOffer.call(vm, //   = Kyiv = {{{2
    vm.d.agent, Keypair.fromSecret(vm.d.keysAgent[0]),
    offerAIM_FOR_BUSINESSES(url)   // Kyiv //////////////
  )
  makeIds = makeIds + r.txId + ' 50.4462921 30.5104239 '
  log('- f_add_hex_makes makeOffer', r.offer, r.balanceId, r.txId)

  r = await makeRequest.call(vm, // = Aukland = {{{2
    vm.d.agent, Keypair.fromSecret(vm.d.keysAgent[0]),
    requestAGENTS_WANTED(url)     // Aukland ///////////
  )
  makeIds = makeIds + r.txId + ' -36.6880111 174.7388642'// Look, Ma! NO SPACE!
  log('- f_add_hex_makes makeRequest', r.request, r.amount, r.balanceId, r.txId)
  // }}}2
  fs.writeFileSync(nwdir + '/HEX_Agent_make2map.txids', makeIds)
}

await setup_selftest(process.argv[2], process.argv[3]).then(_ => process.exit(0)). // {{{1
  catch(err => {
    console.error(err)
    process.exit(1)
  });

