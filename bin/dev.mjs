#!/usr/bin/env node

import { loadKeys, makeSellOffer, } from '../public/lib/sdk.mjs'; // {{{1
import fs from 'fs'
import { 
  configuration,
  hack, post_jcl, post_job, 
  promiseWithResolvers,
  put_agent, setkeys,
} from '../cloudflare-job-fair/lib/jf3.mjs'
import {
  Asset, Keypair, Horizon, Networks, TransactionBuilder, 
} from '@stellar/stellar-sdk'

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
    vm.e.log('hx_use_tm args', args, 'opts', opts)
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
        console.dir(e, { depth: null })
        //vm.d.offerMade && 
          e.bids.length == 0 && stop('Your offer has been matched.')
      }
    }),
    tag: 'orderbook',
  })

  // }}}2
}

function loaded (account) { // {{{1
  let { s, e, c, d } = this
  /*
  */
  makeSellOffer.call(this, d.kp, account, d.MA, d.XLM, '1', '1').then((txId, offerId) => {
    e.log('loaded makeSellOffer txId', txId, 'offerId', offerId)
  })
} 
  
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
