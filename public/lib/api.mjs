/* Copyright (c) 2023-present, Дід Alik and the Kids {{{1
 *
 * This script is licensed under the Apache License, Version 2.0, found in the
 * LICENSE file in the root directory of this source tree.
 * * */

import { // {{{1
  Asset, AuthClawbackEnabledFlag, AuthRevocableFlag,
  BASE_FEE, Keypair, Claimant, Horizon, Memo, Networks, Operation,
  TransactionBuilder, xdr, 
} from '@stellar/stellar-sdk'
import {
  clawbackOffer, clawbackRequest,
  makeClaimableBalance, takeClaimableBalance,
} from './sdk.mjs'

const HEX_FEE = '0.0000100' // {{{1
const HEXA_DISPUTE = '0.0000099'

function chunkDescToOps (description, source = null) { // {{{1
  if (description.length < 1 || description.length > 2000) {
    throw `- chunkDescToOps: description.length is ${description.length}`
  }
  //console.log('- chunkDescToOps description', description)

  // Chunk description Operations into ops array
  let i = 0
  let ops = []
  while (description.length > 64) {
    let chunk = description.slice(0, 64)
    description = description.slice(64)
    //console.log('- chunkDescToOps chunk.length', chunk.length,
      //'description.length', description.length
    //)

    if (source) {
      ops.push(
        Operation.manageData({ name: `data${i}`, value: chunk, source }),
        Operation.manageData({ name: `data${i}`, value: null, source })
      )
    } else {
      ops.push(
        Operation.manageData({ name: `data${i}`, value: chunk, }),
        Operation.manageData({ name: `data${i}`, value: null, })
      )
    }
    i++
  }
  if (description.length > 0) {
    if (source) {
      ops.push(
        Operation.manageData({ name: `data${i}`, value: description, source }),
        Operation.manageData({ name: `data${i}`, value: null, source })
      )
    } else {
      ops.push(
        Operation.manageData({ name: `data${i}`, value: description, }),
        Operation.manageData({ name: `data${i}`, value: null, })
      )
    }
  }

  return ops;
}

function dealOffer ( // {{{1
  maker, kp, balanceId, makeTxId, amount, takeBalanceId, signDeal
) {
  let { s, e, c, d } = this // {{{2
  let memo = Memo.hash(makeTxId)
  let tx = new TransactionBuilder(maker, // increasing the maker's
    {                                    //  sequence number
      fee: BASE_FEE, memo, networkPassphrase: e.nw,
    }
  )
  let ops = [ // {{{2
    Operation.beginSponsoringFutureReserves({ sponsoredId: d.keysIssuer[1] }),
    Operation.claimClaimableBalance({ 
      balanceId: takeBalanceId, source: d.keysIssuer[1]
    }),
    Operation.claimClaimableBalance({ balanceId, source: d.keysIssuer[1] }),
    Operation.payment({ amount, asset: d.ClawableHexa,
      destination: maker.id, source: d.keysIssuer[1]
    }),
    Operation.endSponsoringFutureReserves({ source: d.keysIssuer[1] }),
  ]
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  tx = tx.setTimeout(30).build() // {{{2
  tx.sign(kp)
  return signDeal(tx.toXDR(), 'dealOffer').then(txXdr => {
    let tx = TransactionBuilder.fromXDR(txXdr, e.nw)
    return e.server.submitTransaction(tx).then(txR => ({
      done: 'dealOffer',
      txId: txR.id,
    })).catch(e => {
      console.error('*** ERROR ***', e.response?.data.extras.result_codes)
      throw e;
    });
  }).catch(e => { throw e; }) // }}}2
}

function dealRequest ( // {{{1
  maker, kp, amount, balanceId, makeTxId, takerPK, takeBalanceId, signDeal
) {
  let { s, e, c, d } = this // {{{2
  let memo = Memo.hash(makeTxId)
  let tx = new TransactionBuilder(maker, // increasing the maker's
    {                                    //  sequence number
      fee: BASE_FEE, memo, networkPassphrase: e.nw,
    }
  )
  let ops = [ // {{{2
    Operation.claimClaimableBalance({ balanceId: takeBalanceId }),
    Operation.beginSponsoringFutureReserves({ sponsoredId: d.keysIssuer[1] }),
    Operation.claimClaimableBalance({ balanceId, source: d.keysIssuer[1] }),
    Operation.payment({ amount, asset: d.ClawableHexa,
      destination: takerPK, source: d.keysIssuer[1]
    }),
    Operation.endSponsoringFutureReserves({ source: d.keysIssuer[1] }),
  ]
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  tx = tx.setTimeout(30).build() // {{{2
  tx.sign(kp)
  return signDeal.call(this, tx.toXDR(), 'dealRequest').then(txXdr => {
    let tx = TransactionBuilder.fromXDR(txXdr, e.nw)
    return e.server.submitTransaction(tx).then(txR => ({
      done: 'dealRequest',
      txId: txR.id,
    })).catch(e => {
      console.error('*** ERROR ***', e.response?.data.extras.result_codes)
      throw e;
    });
  }).catch(e => { throw e; }) // }}}2
}

function description (operations) { // {{{1
  let result = ''
  for (let o of operations.records) {
    if (o.type == 'manage_data' && o.value.length > 0) {
      result += Buffer.from(o.value, 'base64').toString()
    } 
  }
  return result;
}

function disputeBrokenDeal (plaintiff, kp, breakDealTxId, validity = '0') { // {{{1
  let { s, e, c, d } = this
  let claimants = [ 
    new Claimant(d.issuer.id,
      validity == '0' ? Claimant.predicateUnconditional()
      : Claimant.predicateBeforeRelativeTime(validity)
    ),  
    new Claimant(plaintiff.id, // plaintiff can reclaim anytime
      Claimant.predicateUnconditional()
    )   
  ]
  let amount = HEXA_DISPUTE
  return makeClaimableBalance.call(this, claimants, plaintiff, kp, amount,
    [], Memo.hash(breakDealTxId)
  );
}

/** function dog2hexa (bigInt) // {{{1
 * Drops Of Gratitude (DOGs) are internal representation of HEXAs. 
 * 1 HEXA is 10000000 DOGs. 1 DOG is 0.0000001 HEXA.
 * A HEXA is a String, a DOG is a BigInt.
 */
function dog2hexa (bigInt) {
  const truncated  = bigInt / 10000000n
  const fractional = bigInt % 10000000n
  let zeroes
  switch (fractional.toString().length) {
    case 1:
      zeroes = '000000'
      break
    case 2:
      zeroes = '00000'
      break
    case 3:
      zeroes = '0000'
      break
    case 4:
      zeroes = '000'
      break
    case 5:
      zeroes = '00'
      break
    case 6:
      zeroes = '0'
      break
    case 7:
      zeroes = ''
  }
  return truncated.toString() + '.' + zeroes + fractional.toString();
}

/** function hexa2dog (str) // {{{1
 * Drops Of Gratitude (DOGs) are internal representation of HEXAs. 
 * 1 HEXA is 10000000 DOGs. 
 * A HEXA is a String, a DOG is a BigInt.
 */
function hexa2dog (str) {
  let dotIndex = str.indexOf('.')
  if (dotIndex < 0) {
    return BigInt(str) * 10000000n;
  }
  let truncated = dotIndex == 0 ? '0' : str.slice(0, dotIndex)
  let fractional = dotIndex == 0 ? '0000000' : str.slice(dotIndex + 1)
  while (fractional.length < 7) {
    fractional += '0'
  }
  return BigInt(truncated) * 10000000n + BigInt(fractional);
}

function makeOffer (maker, kp, description, validity = '0') { // seconds {{{1
  let { s, e, c, d } = this
  let claimants = [ 
    new Claimant(d.issuer.id,
      validity == '0' ? Claimant.predicateUnconditional()
      : Claimant.predicateBeforeRelativeTime(validity)
    ),  
    new Claimant(maker.id, // maker can reclaim anytime
      Claimant.predicateUnconditional()
    )   
  ]
  let amount = HEX_FEE // TODO rename to HEX_KEY
  return makeClaimableBalance.call(this, claimants, maker, kp, amount,
    chunkDescToOps(description), Memo.text(`Offer ${validity}`)
  ).then(r => { r.offer = description; return r; });
}

function makeRequest (maker, kp, description, validity = '0') { // seconds {{{1
  let { s, e, c, d } = this
  let claimants = [ 
    new Claimant(d.issuer.id,
      validity == '0' ? Claimant.predicateUnconditional()
      : Claimant.predicateBeforeRelativeTime(validity)
    ),  
    new Claimant(maker.id, // maker can reclaim anytime
      Claimant.predicateUnconditional()
    )   
  ]
  let amount = parseHEXA(description)
  return makeClaimableBalance.call(this, claimants, maker, kp, amount,
    chunkDescToOps(description), Memo.text(`Request ${validity}`)
  ).then(r => { r.request = description; r.amount = amount; return r; });
}

function offerTakeDeal (opts) { // {{{1
  let { s, e, c, d } = this // {{{2
  e.log('offerTakeDeal opts', opts)

  let amount = opts.effect.amount // {{{2
  let asset = d.ClawableHexa
  let balanceId = opts.effect.balance_id
  let destination = d.user.account.id
  let kp = Keypair.fromSecret(d.user.keys[0])
  let maker = d.user.account
  let signDeal = opts.issuerSign
  let source = d.keysIssuer[1]
  let takeTxId = opts.data.memo2str // NOT opts.tx.id

  let memo = Memo.return(takeTxId)
  let tx = new TransactionBuilder(maker, // increasing the maker's
    {                                    //  sequence number
      fee: BASE_FEE, memo, networkPassphrase: e.nw,
    }
  )

/*  Offer-Take-Deal Diagram             Offer-Take-NoDeal Diagram       {{{2
  +-------+ +--------+ +------+       +-------+ +--------+ +------+
  |  Ann  | | Issuer | |  Bob |       |  Ann  | | Issuer | |  Bob |
  +-------+ +--------+ +------+       +-------+ +--------+ +------+
      |          |         |              |          |         |
      | offer    |         |              | offer    |         |
      |====k====>| effect  |              |====k====>| effect  |
      |    k     |-------->|              |    k     |-------->|
      |    k     |         |              |    k     |         |
      |    k     |    take |              |    k     |    take |
      |   effect |<====t===|              |    k     |<=t===== |
      |<---------|     t   |              |    k     |  t      |
      |-bsfr---->| claim t |              |    k     |  t      |
      |    pay T |====>t   |              |    k     |  t      |
      |<=========|         |              |    k     |  t      |
      |-esfr---->|         |              |    k     |  t      |
      | claim k to drop the offer         |    k     |  t      |
      |===>k     |         |              |    k     |  t claim|
      |          |         |              |    k     |  t<=====|
      |          |         |              |    k     |         |
*/

  let ops = [ // {{{2
    Operation.beginSponsoringFutureReserves({ sponsoredId: source }),
    Operation.claimClaimableBalance({ balanceId, source }),
    Operation.payment({ amount, asset, destination, source }),
    Operation.endSponsoringFutureReserves({ source }),
  ]
  opts.data.makerBalanceId && ops.push( // claim k to drop the offer TODO
    Operation.claimClaimableBalance({
      balanceId: opts.data.makerBalanceId
    })
  )
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  tx = tx.setTimeout(30).build() // {{{2
  tx.sign(kp)
  return signDeal.call(this, tx.toXDR(), 'offerTakeDeal').then(txXdr => {
    console.log('offerTakeDeal signDeal.call then txXdr', txXdr)

    let tx = TransactionBuilder.fromXDR(txXdr, e.nw)
    return e.server.submitTransaction(tx).then(txR => ({
      done: 'offerTakeDeal',
      txId: txR.id,
    })).catch(e => {
      console.error('*** ERROR ***', e.response?.data.extras.result_codes)
      throw e;
    });
  }).then(result => e.log('offerTakeDeal result', result))
  .catch(e => { throw e; }) // }}}2
}

function parseHEXA (desc) { // string {{{1
  let index = desc ? desc.indexOf('HEXA ') : -1
  if (index < 0) {
    return null;
  }
  let words = desc.slice(index).split(' ')
  return words[1].endsWith('.') || words[1].endsWith(',') ?
    words[1].slice(0, words[1].length - 1)
  : words[1].trim();
}

function reclaim (creator, kp, balanceId) { // {{{1
  let { s, e, c, d } = this
  return takeClaimableBalance.call(this, creator, kp, balanceId).then(
    r => r && e.log('reclaim', r)
  );
}

function repayOffer (taker, kp, amount, from, signDeal) { // {{{1
  let { s, e, c, d } = this

  // ClawableHexa amount + HEX_FEE from maker, HEXA amount + HEX_FEE to taker
  c.HEX_FEE = HEX_FEE
  c.dog2hexa = dog2hexa
  c.hexa2dog = hexa2dog
  return clawbackOffer.call(this,
    taker, kp, amount, from, signDeal
  ).then(r => Object.assign({}, r, { done: 'repayOffer' })).
    catch(err => { throw err; });
}

function repayRequest (maker, kp, amount, from, signDeal) { // {{{1
  let { s, e, c, d } = this

  // ClawableHexa amount + HEX_FEE from taker, HEXA amount to maker
  c.HEX_FEE = HEX_FEE
  c.dog2hexa = dog2hexa
  c.hexa2dog = hexa2dog
  return clawbackRequest.call(this,
    maker, kp, amount, from, signDeal
  ).then(r => Object.assign({}, r, { done: 'repayRequest' })).
    catch(err => { throw err; });
}

function requestTakeDeal (opts) { // {{{1
  let { s, e, c, d } = this
  //e.log('requestTakeDeal opts', opts)

  let r_cached = txid => { // {{{2
    let cached = d.tXs_mapped.find(v => v.tx?.id == txid)
    return cached ?
      cached.opts ? [cached.opts.effect.amount, cached.opts.effect.balance_id]
      : [cached.effect.amount, cached.effect.balance_id] // FIXME
    : [c.latest.make.amount, c.latest.make.balanceId];
  }
  let amount = opts.effect.amount // HEX_FEE {{{2
  let asset = d.ClawableHexa
  let balanceId = opts.effect.balance_id
  let destination = opts.tx.source_account // takerId
  let kp = Keypair.fromSecret(d.user.keys[0])
  let maker = d.user.account
  let [r_amount, r_balanceId] = r_cached(opts.data.memo2str)
  let signDeal = opts.issuerSign
  let source = d.keysIssuer[1]
  let takeTxId = opts.tx.id
  /*e.log('requestTakeDeal vars',
    {
      amount, asset, balanceId, destination, kp, maker, r_amount, r_balanceId,
      signDeal, source, takeTxId,
    }
  )*/

  let memo = Memo.return(takeTxId) // {{{2
  let tx = new TransactionBuilder(maker, // increasing the maker's
    {                                    //  sequence number
      fee: BASE_FEE, memo, networkPassphrase: e.nw,
    }
  )

/*  Request-Take-Deal Diagram          Request-Take-NoDeal Diagram       {{{2
  +-------+ +--------+ +------+       +-------+ +--------+ +------+
  |  Ann  | | Issuer | |  Bob |       |  Ann  | | Issuer | |  Bob |
  +-------+ +--------+ +------+       +-------+ +--------+ +------+
     |           |         |              |          |         |
     |  request  |         |              | request  |         |
     |=====r====>| effect  |              |====r====>| effect  |
     |     r     |-------->|              |    r     |-------->|
     |     r     |         |              |    r     |         |
     |     r     |    take |              |    r     |    take |
     |    effect |<====k===|              |    r     |<=k===== |
     |<----------|     k   |              |    r     |  k      |
     |--bsfr---->| claim k |              |    r     |  k      |
     |claiming r |====>k   |              |    r     |  k      |
     |     r<====| pay R   |              |    r     |  k      |
     |drops      |========>|              |    r     |  k claim|
     |the request| pay k   |              |    r     |  k<=====|
     |           |========>|              |    r     |         |
     |-esfr----> |         |              |    r     |         |
*/

  let ops = [ // {{{2
    Operation.beginSponsoringFutureReserves({ sponsoredId: source }),
    Operation.claimClaimableBalance({ balanceId, source }),
    Operation.claimClaimableBalance({ balanceId: r_balanceId, source }),
    Operation.payment({ amount, asset: d.HEXA, destination, source }),
    Operation.payment({ amount: r_amount, asset, destination, source }),
    Operation.endSponsoringFutureReserves({ source }),
  ]
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  tx = tx.setTimeout(30).build() // {{{2
  tx.sign(kp)
  return signDeal(tx.toXDR(), 'requestTakeDeal').then(txXdr => {
    let tx = TransactionBuilder.fromXDR(txXdr, e.nw)
    return e.server.submitTransaction(tx).then(txR => ({
      done: 'requestTakeDeal',
      txId: txR.id,
    })).catch(e => {
      console.error('*** ERROR ***', e.response?.data.extras.result_codes)
      throw e;
    });
  })//.then(result => e.log('requestTakeDeal result', result))
  .catch(e => { throw e; }) // }}}2
}

function takeOffer (taker, kp, makeTxId, amount, validity = '0') { // {{{1
  let { s, e, c, d } = this
  let claimants = [ 
    new Claimant(d.issuer.id,
      validity == '0' ? Claimant.predicateUnconditional()
      : Claimant.predicateBeforeRelativeTime(validity)
    ),  
    new Claimant(taker.id, // taker can reclaim anytime
      Claimant.predicateUnconditional()
    )   
  ]
  //amount = dog2hexa(hexa2dog(amount) + hexa2dog(HEX_FEE))
  return makeClaimableBalance.call(this, claimants, taker, kp, amount,
    [], Memo.hash(makeTxId)
  );
}

function takeRequest (taker, kp, makeTxId, validity = '0') { // {{{1
  let { s, e, c, d } = this
  let claimants = [ 
    new Claimant(d.issuer.id,
      validity == '0' ? Claimant.predicateUnconditional()
      : Claimant.predicateBeforeRelativeTime(validity)
    ),  
    new Claimant(taker.id, // taker can reclaim anytime
      Claimant.predicateUnconditional()
    )   
  ]
  let amount = HEX_FEE
  return makeClaimableBalance.call(this, claimants, taker, kp, amount,
    [], Memo.hash(makeTxId)
  );
}

function toHEXA (amount, signDeal, source = null) { // {{{1
  let { s, e, c, d } = this
  source ??= d.keysIssuer[1]
  let asset = d.ClawableHexa
  let destination = d.user.keys[1]
  let kp = Keypair.fromSecret(d.user.keys[0])
  let user = d.user.account

  let memo = Memo.none() // {{{2
  let tx = new TransactionBuilder(user, // increasing the user's
    {                                   //  sequence number
      fee: BASE_FEE, memo, networkPassphrase: e.nw,
    }
  )
  let ops = [ // {{{2
    Operation.payment({ amount, asset, destination: source }),
    Operation.beginSponsoringFutureReserves({ sponsoredId: source }),
    Operation.payment({ amount, asset: d.HEXA, destination, source }),
    Operation.endSponsoringFutureReserves({ source }),
  ]
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  tx = tx.setTimeout(30).build() // {{{2
  tx.sign(kp)
  return signDeal(tx.toXDR(), 'toHEXA').then(txXdr => {
    let tx = TransactionBuilder.fromXDR(txXdr, e.nw)
    return e.server.submitTransaction(tx).then(txR => ({
      done: 'toHEXA',
      txId: txR.id,
    })).catch(e => {
      console.error('*** ERROR ***', e.response?.data.extras.result_codes)
      throw e;
    });
  }).then(result => Promise.resolve(e.log('toHEXA result', result)))
  .catch(e => { throw e; }) // }}}2
}

export { // {{{1
  HEX_FEE, HEXA_DISPUTE,
  dealOffer, dealRequest, 
  description, disputeBrokenDeal, dog2hexa, hexa2dog,
  makeOffer, makeRequest,
  offerTakeDeal,
  parseHEXA, reclaim, repayOffer, repayRequest,
  requestTakeDeal,
  takeOffer, takeRequest, toHEXA,
}
