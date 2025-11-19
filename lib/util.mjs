import { loadKeys, makeSellOffer, } from '../public/lib/sdk.mjs'; // {{{1
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

export { // {{{1
  hx_use_tm,
}
