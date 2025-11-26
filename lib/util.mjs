import { loadKeys, makeSellOffer, secdVm, } from '../public/lib/sdk.mjs'; // {{{1
import {
  addStream, cbEffect,
} from '../public/lib/aux.mjs'
import { 
  HEX_FEE, disputeBrokenDeal, makeOffer, makeRequest,
  offerTakeDeal, requestTakeDeal, takeOffer, takeRequest,
} from '../public/lib/api.mjs'
import fs from 'fs'
import {
  Asset, Keypair, Horizon, MemoHash, MemoText, Networks, TransactionBuilder, 
} from '@stellar/stellar-sdk'
import { configuration, post_jcl, promiseWithResolvers, put_agent, } from '../cloudflare-job-fair/lib/jf3.mjs'

const _onSIGTERM = vm => { // {{{1
  process.on('SIGTERM', _ => {
    for (let s of vm.s) {
      s.close()
      vm.e.log('on SIGTERM closed', s.tag)
    }
    vm.c.resolve('_onSIGTERM DONE')
  })
}

function cbcc (effect) { // claimable_balance_claimant_created {{{1
  let { s, e, c, d } = this
  let userMakingOffer   = opts => opts.tx.memo_type == MemoText
    && opts.data.offer == true
    && opts.data.pk != d.user.keys[1]
  let userMakingRequest = opts => opts.tx.memo_type == MemoText
    && opts.data.offer == false
    && opts.data.pk != d.user.keys[1]
  let userTakingOffer   = opts => opts.tx.memo_type == MemoHash
    && opts.data.offer == true
    && d.tXs_mapped.find(v => v.tx.id == opts.data.memo2str)
  let userTakingRequest = opts => opts.tx.memo_type == MemoHash
    && opts.data.offer == false
    && d.tXs_mapped.find(v => v.tx.id == opts.data.memo2str)
  let A = (...a) => e.delegate ? {
    args: { txid: a[0], pos: a[1] }, delegate: true
  } : a

  cbEffect.call(this, { effect/*, issuerSign,*/ }).then(o => {
    e.log('cbcc o', o)
    return userMakingOffer(o) ? takeOffer.call(this, ...takeOfferArgs(this, o))
      .then(r => {
        return put_txid_pos(...A(r.txId, [8.7961073, -79.5552843]))   // Tagoba
          .then(text => e.log('cbcc userMakingOffer text', text));
      })
    : userMakingRequest(o) ? takeRequest.call(this, ...takeRequestArgs(this, o))
      .then(r => {
        return put_txid_pos(...A(r.txId, [26.4668328, 127.8232348]))  // Onna
          .then(text => e.log('cbcc userMakingRequest text', text));
      })
    : userTakingOffer(o) ? offerTakeDeal.call(this, o)
    : userTakingRequest(o) ? requestTakeDeal.call(this, o)
    :  e.log('cbcc d.tXs_mapped.length', d.tXs_mapped.push(o))
    }).catch(err => console.error('cbcc UNEXPECTED', err))
}

function dopad (key, value, log) { // {{{1
  let [sk, pk] = loadKeys(fs, process.env.HOME + '/.cloudflare-job-fair/CREATOR.keys')
  let { promise, resolve, reject } = promiseWithResolvers()
  let opts = {}; opts[key] = value
  post_jcl(null, null, null, // node, run, cmd,
    //0 1     2                                                           3        4      5    6      7   8
    pk, 'hx', 'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ', 'dopad', 'put', key, value, sk, opts
  ).then(r => resolve(r))
  return promise.then(r => Promise.resolve('dopad DONE r ' + r));
}

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

function onClawback (effect) { // account_debited {{{1
  let { s, e, c, d } = this
  if (effect.asset_code != 'ClawableHexa' || effect.amount == '10.0000000') {
    return;
  }
  e.log('onClawback effect', effect)

  cbEffect.call(this, { effect })
  .then(o => disputeBrokenDeal.call(this,
    d.agent, Keypair.fromSecret(d.keysAgent[0]), o.tx.id
  ))
  .then(r => e.log('onClawback disputeBrokenDeal r', r))
  .catch(err => console.error('onClawback UNEXPECTED', err))
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

async function selftest (limit, nwdir, send = null, delegate = null) { // {{{1
  let { promise, resolve, reject } = promiseWithResolvers()
  let agent_keys = nwdir + '/HEX_Agent.keys'
  let creator_keys = nwdir + '.keys'
  let keys = nwdir + '/HEX_Issuer.keys'
  let log = send ?? console.log
  let vm = await secdVm(
    loadKeys(fs, keys),       // keysIssuer
    loadKeys(fs, agent_keys), // keysAgent
    log, limit, HEX_FEE, nwdir.endsWith('public'), null, fs
  )
  vm.c.resolve = resolve
  vm.e.delegate = delegate
  vm.d.tXs_mapped = []
  vm.d.user = {
    keys:    vm.d.keysAgent,
    account: vm.d.agent,
  }
  addStream.call(vm, 
    "agent's effects", [
      ['account_debited', onClawback],
    ],
    vm.d.agent.id
  )
  addStream.call(vm, 
    "issuer's effects", [['claimable_balance_claimant_created', cbcc]]
  )
  //_onSIGTERM(vm) TODO call teardown_selftest when done and drop setTimeout 
  setTimeout(_ => {
    for (let s of vm.s) {
      s.close()
      log('setTimeout closed', s.tag)
    }
    teardown_selftest(nwdir, log).then(_ => resolve('setTimeout DONE'))
  }, 6000)
  return promise.then(r => {
    log(r)
    return Promise.resolve('selftest DONE');
  });
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
  return makeIds;
}

function takeOfferArgs (vm, opts) { // {{{1
  let { s, e, c, d } = vm
  return [
    d.user.account,
    Keypair.fromSecret(d.user.keys[0]),
    opts.tx.id,
    opts.data.amount
  ];
}

function takeRequestArgs (vm, opts) { // {{{1
  let { s, e, c, d } = vm
  return [
    d.user.account,
    Keypair.fromSecret(d.user.keys[0]),
    opts.tx.id,
  ];
}

function teardown_selftest (nwdir, log) { // {{{1
  let { promise, resolve, reject } = promiseWithResolvers()
  let [skA, pkA] = loadKeys(fs, `${nwdir}/monitor`, 'Agent')
  let [skI, pkI] = loadKeys(fs, `${nwdir}/monitor`, 'Issuer')

  let vm = { // {{{2
    s: [],
    e: { log, nw: Networks.TESTNET,
      server: new Horizon.Server("https://horizon-testnet.stellar.org"),
    },
    c: {},
    d: { MA: new Asset('MA', pkI), XLM: new Asset('XLM', null), }
  }
  let kp = Keypair.fromSecret(skA); vm.d.kp = kp

  let ob = vm.e.server.orderbook(vm.d.MA, vm.d.XLM).cursor('now') // {{{2
  let stop = text => {
    vm.e.log('teardown_selftest stop text', text)
    vm.s[0].close()
    vm.e.log(`teardown_selftest stop Stream "${vm.s[0].tag}" has been closed. DONE\n`)
    resolve()
  }
  let count = 0

  vm.s.push({ // {{{2
    close: ob.stream({
      onerror:   e => { throw e; },
      onmessage: e => {
        for (let bid of e.bids) {
          log(JSON.stringify(bid))
        }
        ++count == 3 && stop('teardown_selftest DONE')
      }
    }),
    tag: 'orderbook',
  })

  // }}}2

  return vm.e.server.loadAccount(pkA).then(account => loaded.call(vm, account)).
    then(_ => makeSellOffer.call(vm, vm.d.kp, vm.d.account, vm.d.MA, vm.d.XLM, '1', '1')).
    then(_ => promise);
}

export { // {{{1
  dopad, hx_use_tm, selftest, setup_selftest,
}
