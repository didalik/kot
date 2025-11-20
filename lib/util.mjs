import { loadKeys, makeSellOffer, secdVm, } from '../public/lib/sdk.mjs'; // {{{1
import { HEX_FEE, makeOffer, makeRequest, } from '../public/lib/api.mjs'
import fs from 'fs'
import {
  Asset, Keypair, Horizon, Networks, TransactionBuilder, 
} from '@stellar/stellar-sdk'
import { configuration, put_agent, } from '../cloudflare-job-fair/lib/jf3.mjs'

function hx_use_tm (...args) { // {{{1
  let [skA, pkA] = loadKeys(fs, `${process.env.TESTNET_DIR}/monitor`, 'Agent')
  let [skI, pkI] = loadKeys(fs, `${process.env.TESTNET_DIR}/monitor`, 'Issuer')

  let vm = { // {{{2
    s: [],
    e: { log: console.log, nw: Networks.TESTNET,
      server: new Horizon.Server("https://horizon-testnet.stellar.org"),
    },
    c: {},
    d: { MA: new Asset('MA', pkI), XLM: new Asset('XLM', null), }
  }
  let kp = Keypair.fromSecret(skA); vm.d.kp = kp

  configuration.promise.then(opts => { // {{{2
    vm.e.log('hx_use_tm args', args, 'opts', opts, 'configuration', configuration)
    configuration.opts = opts
  })
  vm.e.server.loadAccount(pkA).then(account => loaded.call(vm, account))

  let ob = vm.e.server.orderbook(vm.d.MA, vm.d.XLM).cursor('now') // {{{2
  let stop = text => {
    vm.e.log('hx_use_tm stop text', text)
    vm.s[0].close()
    vm.e.log(`hx_use_tm stop Stream "${vm.s[0].tag}" has been closed. DONE.\n`)
  }
  vm.s.push({
    close: ob.stream({
      onerror:   e => { throw e; },
      onmessage: e => {
        if (vm.d.account && e.bids.length > 0 && !vm.d.granted) { // reset and start the demo
          vm.d.granted = true
          makeSellOffer.call(vm, vm.d.kp, vm.d.account, vm.d.MA, vm.d.XLM, '1', '1')
          configuration.promise = Promise.resolve(configuration.opts)
          put_agent(null, null, null, process.env.JOBAGENT_PK, 'hx', 'DEV_KIT')
        }
        if (vm.d.account && e.bids.length > 0 && vm.d.demo_done) {  // wait for next demo request
          vm.d.granted = false
        }
      }
    }),
    tag: 'orderbook',
  })

  // }}}2
}

function loaded (account) { // {{{1
  let { s, e, c, d } = this
  d.account = account
} 

function offerAIM_FOR_BUSINESSES (url) { // {{{1
  let hash = '#%D0%B4%D1%96%D0%B4-alik--the-kids-aim-for-businesses'
  return `<b>Did Alik & the Kids: AIM FOR BUSINESSES</b><br/>
Automated Integration Modeling by DA&K. Inquiry fee HEXA 10 .
<a href='${url}${hash}' target='_blank'>More...</a>`; //   ^ this space must be kept
}

function offerHEX_FOR_SALE (url) { // {{{1
  let hash = '#stellar-hex-for-sale' //        v that space must be kept
  return `<b>Stellar HEX: FOR SALE</b><br/>
Full or partial ownership. Inquiry fee HEXA 100 .
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

async function setup_selftest (limit, nwdir, send = null) { // {{{1
  let agent_keys = nwdir + '/HEX_Agent.keys'
  let creator_keys = nwdir + '.keys'
  let keys = nwdir + '/HEX_Issuer.keys'
  let log = send ?? console.log
  let vm = await secdVm(
    loadKeys(fs, keys),       // keysIssuer
    loadKeys(fs, agent_keys), // keysAgent
    log, limit, HEX_FEE, nwdir.endsWith('public'), null, fs
  )

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

export { // {{{1
  hx_use_tm, setup_selftest,
}
