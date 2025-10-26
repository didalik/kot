#!/usr/bin/env node

import { // {{{1
  addStream, cbEffect,
} from '../../../../../../public/lib/aux.mjs' // FIXME
import {
  loadKeys, 
  secdVm,
} from '../../../../../../public/lib/sdk.mjs' // FIXME
import { 
  HEX_FEE,
  offerTakeDeal, requestTakeDeal, takeOffer, takeRequest,
} from '../../../../../../public/lib/api.mjs' // FIXME
import {
  post_job,
} from '../../../../../lib/jf3.mjs'
import * as fs from "node:fs"
import { Keypair, MemoHash, MemoText, } from '@stellar/stellar-sdk'

let config = { userKeys: process.env.REPLY } // {{{1

const _onSIGTERM = vm => { // {{{1
  process.on('SIGTERM', _ => {
    for (let s of vm.s) {
      s.close()
      vm.e.log('on SIGTERM closed', s.tag)
    }
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

  cbEffect.call(this, { effect, issuerSign, }).then(o => {
    e.log('cbcc o', o)
    return userMakingOffer(o) ? takeOffer.call(this, ...takeOfferArgs(this, o))
      .then(r => {
        return put_txid_pos(r.txId, [8.7961073, -79.5552843])   // Tagoba
          .then(text => e.log('cbcc userMakingOffer text', text));
      })
    : userMakingRequest(o) ? takeRequest.call(this, ...takeRequestArgs(this, o))
      .then(r => {
        return put_txid_pos(r.txId, [26.4668328, 127.8232348])  // Onna
          .then(text => e.log('cbcc userMakingRequest text', text));
      })
    : userTakingOffer(o) ? offerTakeDeal.call(this, o)
    : userTakingRequest(o) ? requestTakeDeal.call(this, o)
    :  e.log('cbcc d.tXs_mapped.length', d.tXs_mapped.push(o))
    }).catch(err => console.error('cbcc UNEXPECTED', err))
}

function issuerSign (txXDR, tag) { // {{{1
  console.log('issuerSign tag', tag, 'txXDR', txXDR)

  let [sk, pk] = config.userKeys.split(' ')
  return Promise.resolve(
    post_job(null, null, null, // node, run, cmd,
      pk, 'hx', 'HX_KIT', 'issuerSign', sk, { args: { txXDR, tag } }
    )
  ).then(r => Promise.resolve(r));
}

function onClawback (effect) { // account_debited {{{1
  let { s, e, c, d } = this
  if (effect.asset_code != 'ClawableHexa') { // not clawback
    return;
  }
  cbEffect.call(this, { effect })
  .then(o => disputeBrokenDeal.call(this,
    d.agent, Keypair.fromSecret(d.keysAgent[0]), o.tx.id
  ))
  .then(r => e.log('onClawback disputeBrokenDeal r', r))
  .catch(err => console.error('onClawback UNEXPECTED', err))
}

function put_txid_pos (txid, pos) { // {{{1
  let [sk, pk] = config.userKeys.split(' ')

  return Promise.resolve(
    post_job(null, null, null, // node, run, cmd,
      pk, 'hx', 'HX_KIT', 'put_txid_pos', sk, { args: { txid, pos } }
    )
  ).then(r => Promise.resolve(r));
}

async function selftest (limit, nwdir) { // {{{1
  let agent_keys = nwdir + '/HEX_Agent.keys'
  let creator_keys = nwdir + '.keys'
  let keys = nwdir + '/HEX_Issuer.keys'
  let log = console.log
  let vm = await secdVm(
    loadKeys(fs, keys),       // keysIssuer
    loadKeys(fs, agent_keys), // keysAgent
    log, limit, HEX_FEE, nwdir.endsWith('public'), null, fs
  )
  vm.d.tXs_mapped = []
  vm.d.user = {
    keys:    vm.d.keysAgent,
    account: vm.d.agent,
  }
  addStream.call(vm, 
    "agent's effects", [
      ['account_debited', onClawback],
      //['claimable_balance_claimant_created', onAgentEffect] 
    ],
    vm.d.agent.id //, true
  )
  addStream.call(vm, 
    "issuer's effects", [['claimable_balance_claimant_created', cbcc]]
  )
  _onSIGTERM(vm)
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

await selftest(process.argv[2], process.argv[3]).//then(_ => process.exit(0)). // {{{1
  catch(err => {
    console.error(err)
    process.exit(1)
  });

