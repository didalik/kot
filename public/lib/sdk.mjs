/* Copyright (c) 2023-present, Дід Alik and the Kids {{{1
 *
 * This script is licensed under the Apache License, Version 2.0, found in the
 * LICENSE file in the root directory of this source tree.
 * * */

import { // {{{1
  Asset, AuthClawbackEnabledFlag, AuthRevocableFlag, BASE_FEE, Claimant, 
  Keypair, Horizon, 
  Memo, MemoHash, MemoText, 
  Networks, 
  Operation,
  TransactionBuilder, xdr, 
} from '@stellar/stellar-sdk'
import { post_job, post_job_args, } from './jf3.mjs'

async function addHEX_CREATOR (server = null, doLoad = false) { // {{{1
  let { s, e, c, d } = this
  server ??= new Horizon.Server("https://horizon-testnet.stellar.org")
  let account = null
  let [HEX_CREATOR_SK, HEX_CREATOR_PK] = storeKeys.call(this, 
    'build', 'testnet'
  )
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(HEX_CREATOR_PK)}`
    );
    const responseJSON = await response.json();
    e.log('the HEX_CREATOR account created txId', responseJSON.id)
    doLoad = true
  } catch (e) {
    console.error("ERROR!", e);
  }
  if (doLoad) {
    account = await server.loadAccount(HEX_CREATOR_PK)
    e.log('loaded HEX_CREATOR', account?.id)
  }
  c.account = account
  d.keys = [HEX_CREATOR_SK, HEX_CREATOR_PK]
  d.kp = Keypair.fromSecret(HEX_CREATOR_SK)
  e.nw = Networks.TESTNET
  e.server = server
  return Promise.resolve();
}

async function addHEX_Agent (limit) { // {{{1
  let { s, e, c, d } = this
  limit = limit.toString()
  e.log('addHEX_Agent limit', limit)
  let [HEX_Agent_SK, HEX_Agent_PK] = storeKeys.call(this,
    'build/testnet', 'HEX_Agent'
  )
  let txId = await createAccount.call(this, HEX_Agent_PK, '9', {}, d.kp)
  e.log('addHEX_Agent', HEX_Agent_PK, 'txId', txId)

  d.keysIssuer ??= loadKeys(c.fs, 'build/testnet', 'HEX_Issuer')
  let [HEX_Issuer_SK, HEX_Issuer_PK] = d.keysIssuer
  const ClawableHexa = new Asset('ClawableHexa', HEX_Issuer_PK)
  const HEXA = new Asset('HEXA', HEX_Issuer_PK)
  let agent = await e.server.loadAccount(HEX_Agent_PK)
  e.log('addHEX_Agent loaded agent', agent.id)
  let issuer = await e.server.loadAccount(HEX_Issuer_PK)
  e.log('addHEX_Agent loaded issuer', issuer.id)
  let keysAgent = [HEX_Agent_SK, HEX_Agent_PK]
  Object.assign(d, 
    { ClawableHexa, HEXA, agent, keysAgent, issuer, limit }
  )

  // Have HEX Agent trust HEXA and ClawableHexa - up to limit
  txId = await trustAssets.call(this, 
    agent, Keypair.fromSecret(HEX_Agent_SK), limit, HEXA, ClawableHexa
  )
  e.log('addHEX_Agent agent trusts HEXA and ClawableHexa limit', limit, 'txId', txId)

  // Fund Agent with HEXA, update Agent's HEXA trustline
  await updateTrustlineAndPay.call(this,
    issuer, Keypair.fromSecret(HEX_Issuer_SK), HEX_Agent_PK, limit, HEXA
  )
  
  return Promise.resolve();
}

async function addHEX_Issuer (homeDomain) { // {{{1
  let { s, e, c, d } = this
  e.log('addHEX_Issuer...')

  let [HEX_Issuer_SK, HEX_Issuer_PK] = storeKeys.call(this,
    'build/testnet', 'HEX_Issuer'
  )
  let txId = await createAccount.call(this, HEX_Issuer_PK, '9',
    {
      homeDomain,
      setFlags: AuthClawbackEnabledFlag | AuthRevocableFlag,
      source: HEX_Issuer_PK,
    },
    d.kp, Keypair.fromSecret(HEX_Issuer_SK)
  )
  e.log('addHEX_Issuer', HEX_Issuer_PK, 'txId', txId)

  d.keysIssuer = [HEX_Issuer_SK, HEX_Issuer_PK]
  return Promise.resolve();
}

async function addMA_Agent (limit, keysIssuer, init, ...args) { // {{{1
  let { s, e, c, d } = this
  e.log('addMA_Agent...')

  let [Agent_SK, Agent_PK] = storeKeys.call(this, ...args)
  let [Issuer_SK, Issuer_PK] = keysIssuer
  let txId = await createAccount.call(this, Agent_PK, '9', {}, d.kp)
  e.log('addMA_Agent', Agent_PK, 'txId', txId)
  await init(this, keysIssuer, [Agent_SK, Agent_PK], limit)

  // Have HEX Agent trust MA - up to limit
  txId = await trustAssets.call(this, 
    d.agent, Keypair.fromSecret(Agent_SK), limit, d.MA
  )
  e.log('addMA_Agent agent trusts MA limit', limit, 'txId', txId)

  // Fund Agent with MA, update Agent's MA trustline
  await updateTrustlineAndPay.call(this,
    d.issuer, Keypair.fromSecret(Issuer_SK), Agent_PK, limit, d.MA
  )
  
  return Promise.resolve();
}

function addMA_CREATOR (...args) { // {{{1
  let { s, e, c, d } = this
  e.server ??= new Horizon.Server("https://horizon-testnet.stellar.org")
  e.nw = Networks.TESTNET
  let [CREATOR_SK, CREATOR_PK] = storeKeys.call(this, ...args)
  return fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(CREATOR_PK)}`
  ).then(response => response.json()).then(responseJSON => {
    e.log('CREATOR account created txId', responseJSON.id)
    return e.server.loadAccount(CREATOR_PK);
  }).then(account => {
    c.account = account // used by createAccount
    e.log('loaded CREATOR', account.id)
    // used by addMA_Agent VVVV
    return Promise.resolve(d.kp = Keypair.fromSecret(CREATOR_SK));
  });
}

async function addMA_Issuer (homeDomain, kp, ...args) { // {{{1
  let { s, e, c, d } = this
  e.log('addMA_Issuer...')

  let [Issuer_SK, Issuer_PK] = storeKeys.call(this, ...args)
  let txId = await createAccount.call(this, Issuer_PK, '9',
    {
      homeDomain,
      setFlags: AuthClawbackEnabledFlag | AuthRevocableFlag,
      source: Issuer_PK,
    },
    kp, Keypair.fromSecret(Issuer_SK)
  )
  e.log('addMA_Issuer', Issuer_PK, 'txId', txId)
  return Promise.resolve([Issuer_SK, Issuer_PK]);
}

function clawback (breaker, kp, dealTxId, amount, from, signDeal) { // {{{1
  let { s, e, c, d } = this
  let memo = Memo.hash(dealTxId)
  let tx = new TransactionBuilder(breaker, // increasing the breaker's
    {                                    //  sequence number
      fee: BASE_FEE, memo, networkPassphrase: e.nw,
    }
  )
  let ops = [
    Operation.beginSponsoringFutureReserves({ sponsoredId: d.keysIssuer[1] }),
    Operation.clawback({ 
      asset: d.ClawableHexa, amount, from, source: d.keysIssuer[1]
    }),
    Operation.payment({ amount, asset: d.HEXA,
      destination: breaker.id, source: d.keysIssuer[1]
    }),
    Operation.endSponsoringFutureReserves({ source: d.keysIssuer[1] }),
  ]
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  tx = tx.setTimeout(30).build()
  tx.sign(kp)
  return signDeal(tx.toXDR(), 'clawback').then(txXdr => {
    let tx = TransactionBuilder.fromXDR(txXdr, e.nw)
    return e.server.submitTransaction(tx).then(txR => ({
      done: 'clawback',
      txId: txR.id,
    })).catch(e => {
      console.error('*** ERROR ***', e.response?.data.extras.result_codes)
      throw e;
    });
  }).catch(e => { throw e; })
}

function clawbackOffer (taker, kp, amount, from, signDeal) { // {{{1
  let { s, e, c, d } = this
  // ClawableHexa amount + HEX_FEE from maker, HEXA amount + HEX_FEE to taker
  amount = c.dog2hexa(c.hexa2dog(amount) + c.hexa2dog(c.HEX_FEE))
  let tx = new TransactionBuilder(taker, // increasing the taker's
    {                                    //  sequence number
      fee: BASE_FEE, networkPassphrase: e.nw,
    }
  )
  let ops = [
    Operation.beginSponsoringFutureReserves({ sponsoredId: d.keysIssuer[1] }),
    Operation.clawback({ 
      asset: d.ClawableHexa, amount, from, source: d.keysIssuer[1]
    }),
    Operation.payment({ amount, asset: d.HEXA,
      destination: taker.id, source: d.keysIssuer[1]
    }),
    Operation.endSponsoringFutureReserves({ source: d.keysIssuer[1] }),
  ]
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  tx = tx.setTimeout(30).build()
  tx.sign(kp)
  return signDeal.call(this, tx.toXDR(), 'clawbackOffer').then(txXdr => {
    let tx = TransactionBuilder.fromXDR(txXdr, e.nw)
    return e.server.submitTransaction(tx).then(txR => ({
      done: 'clawbackOffer',
      txId: txR.id,
    })).catch(e => {
      console.error('*** ERROR ***', e.response?.data.extras.result_codes)
      throw e;
    });
  }).catch(e => { throw e; })
}

function clawbackRequest (maker, kp, amount, from, signDeal) { // {{{1
  let { s, e, c, d } = this
  // ClawableHexa amount + HEX_FEE from taker, HEXA amount to maker
  let amountFrom = c.dog2hexa(c.hexa2dog(amount) + c.hexa2dog(c.HEX_FEE))
  let tx = new TransactionBuilder(maker, // increasing the maker's
    {                                    //  sequence number
      fee: BASE_FEE, networkPassphrase: e.nw,
    }
  )
  let ops = [
    Operation.beginSponsoringFutureReserves({ sponsoredId: d.keysIssuer[1] }),
    Operation.clawback({ 
      asset: d.ClawableHexa, amount: amountFrom, from, source: d.keysIssuer[1]
    }),
    Operation.payment({ amount, asset: d.HEXA,
      destination: maker.id, source: d.keysIssuer[1]
    }),
    Operation.endSponsoringFutureReserves({ source: d.keysIssuer[1] }),
  ]
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  tx = tx.setTimeout(30).build()
  tx.sign(kp)
  return signDeal.call(this, tx.toXDR(), 'clawbackRequest').then(txXdr => {
    let tx = TransactionBuilder.fromXDR(txXdr, e.nw)
    return e.server.submitTransaction(tx).then(txR => ({
      done: 'clawbackRequest',
      txId: txR.id,
    })).catch(e => {
      console.error('*** ERROR ***', e.response?.data.extras.result_codes)
      throw e;
    });
  }).catch(e => { throw e; })
}

function convertClawableHexa (dest, kp, amount, signDeal) { // {{{1
  let { s, e, c, d } = this
  let tx = new TransactionBuilder(dest, // increasing the dest's
    {                                   //  sequence number
      fee: BASE_FEE, networkPassphrase: e.nw,
    }
  )
  let ops = [
    Operation.payment({ amount, asset: d.ClawableHexa, destination: d.keysIssuer[1]
    }),
    Operation.beginSponsoringFutureReserves({ sponsoredId: d.keysIssuer[1] }),
    Operation.payment({ amount, asset: d.HEXA,
      destination: dest.id, source: d.keysIssuer[1]
    }),
    Operation.endSponsoringFutureReserves({ source: d.keysIssuer[1] }),
  ]
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  tx = tx.setTimeout(30).build()
  tx.sign(kp)
  return signDeal.call(this, tx.toXDR(), 'convertClawableHexa').then(txXdr => {
    let tx = TransactionBuilder.fromXDR(txXdr, e.nw)
    return e.server.submitTransaction(tx).then(txR => ({
      done: 'convertClawableHexa',
      txId: txR.id,
    })).catch(e => {
      console.error('*** ERROR ***', e.response?.data.extras.result_codes)
      throw e;
    });
  }).catch(e => { throw e; })
}

async function createAccount ( // {{{1
  destination, startingBalance, opts, ...keypairs
) {
  let { s, e, c, d } = this
  let tx = new TransactionBuilder(c.account, { fee: BASE_FEE }).
    addOperation(Operation.createAccount({ destination, startingBalance })).
    addOperation(Operation.setOptions(opts)).
    setNetworkPassphrase(e.nw).
    setTimeout(30).build();
  tx.sign(...keypairs)
  tx =  await e.server.submitTransaction(tx).catch(e => console.error(
    '*** ERROR ***', e.response.data.extras.result_codes
  ))
  return tx?.id;
}

function getClaimableBalanceId (result_xdr, index = 0) { // {{{1
  let txResult = xdr.TransactionResult.fromXDR(result_xdr, "base64");
  let results = txResult.result().results();
  let operationResult = results[index].value().createClaimableBalanceResult();
  let balanceId = operationResult.balanceId().toXDR("hex");
  return balanceId;
}

function get_txid_pos (txid) { // {{{1
  return Promise.resolve(post_job(
    post_job_args(
      'hx',
      'HX_KIT',
      'get_txid_pos',
      decodeURIComponent(config.userKeys), // using window.config
    ),
    { args: { txid } }
  ).then(r => Promise.resolve(JSON.parse(r))));
}

function issuerSign (txXDR, tag) { // {{{1
  return Promise.resolve(post_job(
    post_job_args(
      'hx',
      'HX_KIT',
      'issuerSign',
      decodeURIComponent(config.userKeys), // using window.config
    ),
    { args: { txXDR, tag } }
  ).then(r => Promise.resolve(r)));
}

function loadKeys (fs, dirname, basename = null) { // {{{1
  let SK_PK = fs.readFileSync(
    basename ? `${dirname}/${basename}.keys` : dirname
  )
  let pair = SK_PK.toString().split(' ')
  return [pair[0].trim(), pair[1].trim()];
}

async function makeBuyOffer( // {{{1
  kp, account, buying, selling, buyAmount, price, offerId = 0
) {
  let { s, e, c, d } = this
  e.log('makeBuyOffer', account.id, 'buying', buying.code,
    'selling', selling.code, 'buyAmount', buyAmount, 'price', price,
    'offerId', offerId
  )
  let tx = new TransactionBuilder(account, // increasing account's
    {                                      //  sequence number
      fee: BASE_FEE, networkPassphrase: e.nw,
    }
  ).addOperation(Operation.manageBuyOffer({
    selling, buying, buyAmount, price, offerId
  })).setTimeout(30).build()

  tx.sign(kp)
  tx =  await e.server.submitTransaction(tx).catch(e => console.error(
    '*** ERROR ***', e.response.data.extras.result_codes
  ))
  let made = buyAmount == '0' || +offerId > 0 ? offerDeleted(tx.result_xdr)
  : offerMade(tx.result_xdr)
  e.log('makeBuyOffer', account.id, tx.id, made.offer.id)
  return Promise.resolve([tx.id, made.offer.id]);
}

function makeClaimableBalance ( // {{{1
  claimants, maker, kp, amount, ops = [], memo = null
) {
  let { s, e, c, d } = this
  let tx = new TransactionBuilder(maker, // increasing the maker's
    {                                    //  sequence number
      fee: BASE_FEE, memo, networkPassphrase: e.nw,
    }
  )
  tx = tx.addOperation(Operation.createClaimableBalance({ 
    claimants, asset: d.HEXA, amount
  }))
  for (let op of ops) {
    tx = tx.addOperation(op)
  }
  //e.log('- makeClaimableBalance ops.length', ops.length)

  tx = tx.setTimeout(30).build()
  tx.sign(kp)
  return e.server.submitTransaction(tx).then(txR => ({
    balanceId: getClaimableBalanceId(txR.result_xdr),
    txId: txR.id,
  })).catch(e => {
    console.error('*** ERROR *** makeClaimableBalance', 
      e.response?.data.extras.result_codes //,
      //e.message, e.stack
    )
    throw e;
  });
}

async function makeSellOffer( // {{{1
  kp, account, selling, buying, amount, price, offerId = 0
) {
  let { s, e, c, d } = this
  let tx = new TransactionBuilder(account, // increasing account's
    {                                      //  sequence number
      fee: BASE_FEE, networkPassphrase: e.nw,
    }
  ).addOperation(Operation.manageSellOffer({
    selling, buying, amount, price, offerId
  })).setTimeout(30).build()

  let result = tx => {
    let made = offerMade(tx.result_xdr, 'manageSellOfferResult')
    return Promise.resolve([tx.id, made.offer.id]);
  }
  if (!kp) {
    return c.sign(tx, tx => result(tx));
  }
  tx.sign(kp)
  tx =  await e.server.submitTransaction(tx).catch(e => console.error(
    '*** ERROR ***', e.response.data.extras.result_codes
  ))
  return result(tx);
}

function memo2str (tx) { // {{{1
  if (tx.memo_type == MemoHash) {
    return Buffer.from(tx.memo, 'base64').toString('hex');
  }
  if (tx.memo_type == MemoText) {
    return tx.memo.toString();
  }
}

function offerDeleted (result_xdr, kind = 'manageBuyOfferResult') { // {{{1
  let result = 
    xdr.TransactionResult.fromXDR(result_xdr, "base64").result().results()

  let index = result.length == 3 ? 1
  : result.length == 1 ? 0
  : undefined
  result = result[index] // 0:begin, 1:manage...Offer, 2:end
    .value()[kind]().value()
  let offersClaimed = result._attributes.offersClaimed

  result = { offer: { id: null }, offersClaimedLength: offersClaimed.length, }
  //console.dir(result, { depth: null })
  return result;
}

function offerMade (result_xdr, kind = 'manageBuyOfferResult') { // {{{1
  let result = 
    xdr.TransactionResult.fromXDR(result_xdr, "base64").result().results()

  let index = result.length == 3 ? 1
  : result.length == 1 ? 0
  : undefined
  result = result[index] // 0:begin, 1:manage...Offer, 2:end
    .value()[kind]().value()
  let offersClaimed = result._attributes.offersClaimed
  let offer = result.offer().value()
  let id = offer?.offerId().low
  let price_r = offer?.price()._attributes

  result = { offer: { id, price_r, }, offersClaimedLength: offersClaimed.length, }
  //console.dir(result, { depth: null })
  return result;
}

function put_txid_pos (txid, pos) { // {{{1
  return Promise.resolve(post_job(
    post_job_args(
      'hx',
      'HX_KIT',
      'put_txid_pos',
      decodeURIComponent(config.userKeys), // using window.config
    ),
    { args: { txid, pos } }
  ).then(r => Promise.resolve(r)));
}

function reset (amountHEXA) { // {{{1
  let { s, e, c, d } = this
  e.log('reset amountHEXA', amountHEXA)
  return addHEX_CREATOR.call(this).then(
    _ => amountHEXA ? 
      addHEX_Agent.call(this, amountHEXA) :
      addHEX_Issuer.call(this, 'hx.kloudoftrust.org')
  );
}

async function secdVm ( // {{{1
  keysIssuer, keysAgent, log, limit, HEX_FEE, PUBLIC = false, kit = null, fs = null
) {
  let s = []
  const nw = PUBLIC ? Networks.PUBLIC : Networks.TESTNET
  const server = new Horizon.Server(
    PUBLIC ? "https://horizon.stellar.org" 
    : "https://horizon-testnet.stellar.org"
  )
  let e = { log, nw, server }
  let c = { HEX_FEE, fs, kit }
  const ClawableHexa = new Asset('ClawableHexa', keysIssuer[1])
  const HEXA = new Asset('HEXA', keysIssuer[1])
  const XLM = new Asset('XLM', null)
  const agent = keysAgent ? await server.loadAccount(keysAgent[1]) : null
  const issuer = await server.loadAccount(keysIssuer[1])
  let d = { ClawableHexa, HEXA, XLM, agent, issuer, keysIssuer, keysAgent, limit }
  return { s, e, c, d };
}

function storeKeys (dirname, basename) { // {{{1
  let { s, e, c, d } = this
  c.fs && c.fs.mkdirSync(dirname, { recursive: true, })
  let pair = Keypair.random()
  let SK_PK = pair.secret() + ' ' + pair.publicKey()
  c.fs && c.fs.writeFileSync(`${dirname}/${basename}.keys`, SK_PK)
  let p = SK_PK.toString().split(' ')
  return [p[0].trim(), p[1].trim()];
}

function takeClaimableBalance (taker, kp, balanceId) { // {{{1
  let { s, e, c, d } = this
  let tx = new TransactionBuilder(taker, // increasing the taker's
    {                                    //  sequence number
      fee: BASE_FEE, networkPassphrase: e.nw,
    }
  )
  tx = tx.addOperation(Operation.claimClaimableBalance({ balanceId }))
  tx = tx.setTimeout(30).build()
  tx.sign(kp)
  return e.server.submitTransaction(tx).then(txR => ({
    balanceId, txId: txR.id,
  })).catch(err => {
    if (err.response?.data.extras.result_codes.operations[0] ==
      'op_does_not_exist') {
      e.log('takeClaimableBalance balanceId NOT FOUND', balanceId)
      return;
    }
    console.error('*** ERROR ***', err.response?.data.extras.result_codes)
    throw err;
  });
}

async function trustAssets( // {{{1
  recipient, recipientKeypair, limit, ...assets
) {
  let { s, e, c, d } = this
  let tx = new TransactionBuilder(recipient, // increasing the recipient's
    {                                        //  sequence number
      fee: BASE_FEE,
      networkPassphrase: e.nw,
    }
  )
  for (let asset of assets) {
    tx = tx.addOperation(Operation.changeTrust({ asset, limit }))
  }
  tx = tx.setTimeout(30).build()

  tx.sign(recipientKeypair)
  tx =  await e.server.submitTransaction(tx).catch(e => console.error(
    '*** ERROR ***', e.response.data.extras.result_codes
  ))
  return tx.id;
}

async function updateTrustline( // {{{1
  account, accountKeypair, trustor, asset, source = null, sign = null
) {
  let { s, e, c, d } = this
  let tx = new TransactionBuilder(account, // increasing the account's
    {                                     //  sequence number
      fee: BASE_FEE,
      networkPassphrase: e.nw,
    }
  ).addOperation(Operation.setTrustLineFlags({ asset, trustor, source,
      flags: {
        clawbackEnabled: false
      },
    })).
    setTimeout(30).build()

  tx.sign(accountKeypair)
  if (sign) {
    return sign(tx.toXDR(), 'updateTrustline').then(txXdr => 
      e.server.submitTransaction(TransactionBuilder.fromXDR(txXdr, e.nw))
    );
  }
  tx =  await e.server.submitTransaction(tx).catch(e => console.error(
    '*** ERROR ***', e.response.data.extras.result_codes
  ))
  return tx.id;
}

async function updateTrustlineAndPay( // {{{1
  account, accountKeypair, destination, amount, asset, source = null, sign = null
) {
  let { s, e, c, d } = this
  let tx = new TransactionBuilder(account, // increasing the account's
    {                                     //  sequence number
      fee: BASE_FEE,
      networkPassphrase: e.nw,
    }
  ).addOperation(Operation.payment({ asset, destination, amount, source })).
    addOperation(Operation.setTrustLineFlags({ 
      asset, source,
      trustor: destination,
      flags: {
        clawbackEnabled: false
      },
    })).
    setTimeout(30).build()

  tx.sign(accountKeypair)
  if (sign) {
    return sign(tx.toXDR(), 'updateTrustlineAndPay').then(txXdr =>
      e.server.submitTransaction(TransactionBuilder.fromXDR(txXdr, e.nw))
    );
  }
  tx =  await e.server.submitTransaction(tx).catch(e => console.error(
    '*** ERROR ***', e.response.data.extras.result_codes
  ))
  return tx?.id;
}

export { // {{{1
  addHEX_Agent, addHEX_CREATOR, addHEX_Issuer, 
  addMA_Agent, addMA_CREATOR, addMA_Issuer,
  clawback, clawbackOffer, clawbackRequest,
  convertClawableHexa, createAccount,
  get_txid_pos,
  issuerSign, 
  loadKeys,
  makeBuyOffer, makeClaimableBalance, makeSellOffer, memo2str,
  put_txid_pos,
  reset,
  secdVm,
  storeKeys, takeClaimableBalance,
  trustAssets, updateTrustline, updateTrustlineAndPay,
}
