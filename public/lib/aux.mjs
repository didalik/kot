/* Copyright (c) 2023-present, Дід Alik and the Kids {{{1
 *
 * This script is licensed under the Apache License, Version 2.0, found in the
 * LICENSE file in the root directory of this source tree.
 * * */

import { // {{{1
  MemoHash, MemoReturn, MemoText,
} from '@stellar/stellar-sdk'
//import { memo2str, } from './sdk.mjs'
import {
  HEX_FEE, HEXA_DISPUTE, description, parseHEXA,
} from './api.mjs'
/*
import { generateKeyPair, } from '../../lib/jose/generate.mjs'
import { importEd25519, } from '../../lib/jose/key/import.mjs'
import { SignJWT, } from '../../lib/jose/jwt/sign.mjs'
import { jwtVerify, } from '../../lib/jose/jwt/verify.mjs'
import { createLocalJWKSet, } from '../../lib/jose/jwks/local.mjs'
*/
import { base64ToUint8, sign, uint8ToBase64, verifyData, } from './util.mjs'

function addStream (tag, types, id = null, now = false) { // {{{1
  let { s, e, c, d } = this
  id ??= d.issuer.id
  if (s.find(v => v.id == id)) {
    e.log('addStream found id', id)

    return;
  }
  let effects4account = e.server.effects().forAccount(id)
  if (now) {
    effects4account = effects4account.cursor('now')
  }
  e.log('addStream tag', tag, 'types', types, 'id', id, 'now', now)

  let close = effects4account.stream({
    onerror:   e => { close(); throw e; },
    onmessage: e => {
      let pair = types.find(p => p[0] == e.type)
      if (!pair) {
        return;
      }
      pair[1].call(this, e)
    }
  })
  s.push({ close, id, tag, })
}

function cbEffect (opts) { // claimable_balance_claimant_created {{{1
  let { s, e, c, d } = this

  let deal = o => { // {{{2
    o.data ??= {}
    let memo2str = Buffer.from(o.tx.memo, 'base64').toString('hex')
    //let { amount, balance_id } = o.effect
    Object.assign(
      o.data, { memo2str, }
    )
    return Promise.resolve(o);
  }

  let make = (o, ops) => { // {{{2
    let desc = description(ops)
    o.data ??= {}
    Object.assign(
      o.data, { memo: o.tx.memo, memo_type: o.tx.memo_type },
      { amount: parseHEXA(desc), desc, pk: ops.records[0].source_account },
      { offer: o.tx.memo.startsWith('Offer') }
    )
    return Promise.resolve(o);
  }

  let take = o => { // {{{2
    o.data ??= {}
    let memo2str = Buffer.from(o.tx.memo, 'base64').toString('hex')
    //let { amount, balance_id } = o.effect
    Object.assign(
      o.data, { 
        memo2str, 
        offer: o.effect.amount == HEXA_DISPUTE ? null : o.effect.amount != HEX_FEE 
      }
    )
      //pk: opts.tx.source_account },
    return Promise.resolve(o);
  }

  // }}}2
  return opts.effect.operation().then(op => op.transaction())
  .then(t => (opts.tx = t).operations())
  .then(ops =>
    opts.tx.memo_type == MemoReturn ? deal(opts) :
    opts.tx.memo_type == MemoHash ? take(opts) :
    opts.tx.memo_type == MemoText ? make(opts, ops) :
    Promise.resolve(null)
  );
}

/*async function jwt () { // {{{1
  // run here with :!clear;cd jc2hX;. lib/util.sh;RUN_MJS=bin/run.mjs jwt
  ////
  let alg = 'EdDSA' //'ES384' //'EdDSA' // {{{2
  let keys = await generateKeyPair.call(this,
    alg, { crv: 'Ed25519', extractable: true, }
  )
  let pk = await this.exportKey('raw', keys.publicKey)
  pk = uint8ToBase64(new Uint8Array(pk))
  let sk = await this.exportKey('jwk', keys.privateKey)
  sk = JSON.stringify(sk)
  //console.log('- jwt pk', pk, await this.exportKey('jwk', keys.publicKey), 'sk', sk)
  
  const jwt = await new SignJWT({ 'urn:example:claim': true })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer('urn:example:issuer')
    .setAudience('urn:example:audience')
    .setExpirationTime('2h')
    .sign(this, keys.privateKey)

  console.log('- jwt payload', process.env.payload, 'header', process.env.header)
  keys.data2sign = process.env.payload
  let [payload64, sig64] = await sign.call(this, keys)
  console.log('- jwt payload', payload64, sig64)
  console.log('- jwt', jwt)

  let verified = await verifyData.call(this, payload64, pk, sig64)
  console.log('\n- jwt verified', verified, 'pk', pk, '\n')
  let header64 = uint8ToBase64(process.env.header)
  console.log('- jwt', `${header64}.${payload64}.${sig64}`)
  return;

  const JWKS = createLocalJWKSet(this, { // {{{2
    keys: [
      {
        crv: 'P-256',
        kty: 'EC',
        x: 'ySK38C1jBdLwDsNWKzzBHqKYEE5Cgv-qjWvorUXk9fw',
        y: '_LeQBw07cf5t57Iavn4j-BqJsAD1dpoz8gokd3sBsOo',
        alg: 'ES256',
      },
      {
        key_ops: [ 'verify' ],
        ext: true,
        crv: 'Ed25519',
        x: 'qmsIE77haAjzmQFiPlU8zbaNJHjip8HOhG10TjctN78',
        kty: 'OKP'
      },
      {
        key_ops: [ 'verify' ],
        ext: true,
        kty: 'EC',
        x: 'U7SogLSHxNmTSb9D6HMmOSPYfNffU0U4nAIBOfGQqnt6xlYTrIUXJuViVjj9cSLt',
        y: '8K4_5wML2iMh9VqCviu2JlIm3iZk1k0O_qUpDjrEgIUyjHHyPKME0Bh6lqP8Hm3t',
        crv: 'P-384'
      },
    ],
  })

  const { payload, protectedHeader } = await jwtVerify.call(this, jwt, JWKS, {
    issuer: 'urn:example:issuer',
    audience: 'urn:example:audience',
  })
  console.log(protectedHeader)
  console.log(payload) // }}}2
}
*/
function postBody (origin, pathname, body) { // {{{1
  let method = 'POST'
  return fetch(origin + pathname, { method, body })
  .then(response => response.text());
}

export { // {{{1
  addStream, cbEffect, postBody,
}
