#!/usr/bin/env node

import { // {{{1
  addStream, cbEffect,
} from '../../../../../../public/lib/aux.mjs' // FIXME
import {
  loadKeys, secdVm,
} from '../../../../../../public/lib/sdk.mjs' // FIXME
import { 
  HEX_FEE,
} from '../../../../../../public/lib/api.mjs' // FIXME
import * as fs from "node:fs"
import { MemoHash, MemoText, } from '@stellar/stellar-sdk'

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

  let issuerSign = (body, tag) => postBody(_originCFW, '/' + tag, body)
  cbEffect.call(this, { effect, issuerSign, }).then(o => {
    e.log('cbcc o', o)

    userMakingOffer(o) ? takeOffer.call(this, ...takeOfferArgs(this, o))
      .then(r => {
        let body = JSON.stringify([
          r.txId, [8.7961073, -79.5552843],   // Tagoba
        ])
        return postBody(_originCFW, '/put_txid_pos', body)
          .then(text => e.log('cbcc userMakingOffer text', text));
      })
    : userMakingRequest(o) ? takeRequest.call(this, ...takeRequestArgs(this, o))
      .then(r => {
        let body = JSON.stringify([
          r.txId, [26.4668328, 127.8232348],  // Onna
        ])
        return postBody(_originCFW, '/put_txid_pos', body)
          .then(text => e.log('cbcc userMakingRequest text', text));
      })
    : userTakingOffer(o) ? offerTakeDeal.call(this, o)
    : userTakingRequest(o) ? requestTakeDeal.call(this, o)
    :  e.log('cbcc d.tXs_mapped.length', d.tXs_mapped.push(o))
    }).catch(err => console.error('cbcc UNEXPECTED', err))
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

await selftest(process.argv[2], process.argv[3]).//then(_ => process.exit(0)). // {{{1
  catch(err => {
    console.error(err)
    process.exit(1)
  });

