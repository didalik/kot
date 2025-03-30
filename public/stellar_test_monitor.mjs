import { makeBuyOffer, trustAssets, } from '../lib/sdk.mjs' // {{{1
import { postBody, } from '../lib/aux.mjs'
import { retrieveItem, storeItem, } from '../../lib/util.mjs'
import { 
  Asset, Keypair, Horizon, Networks, TransactionBuilder,
} from '@stellar/stellar-sdk'

let vm = { // {{{1
  s: [], 
  e: { log: console.log, nw: Networks.TESTNET,
    server: new Horizon.Server("https://horizon-testnet.stellar.org"),
  }, 
  c: {}, 
  d: { MA: new Asset('MA', 'MA_Issuer_PK'), XLM: new Asset('XLM', null), } 
}

const _originCFW = location.origin.startsWith('https:') ? // {{{1
  'https:/svc-hex.didalik.workers.dev'
: 'http://u22:8788'

vm.c.sign = (tx, result) => postBody(_originCFW, '/jc-worker', tx.toXDR())
  .then(txXdr => {
    let tx = TransactionBuilder.fromXDR(txXdr, vm.e.nw)
    return e.server.submitTransaction(tx).then(txR => result(txR))
      .catch(e => {
        console.error('*** ERROR ***', e.response?.data.extras.result_codes)
        throw e;
      });
  })

let c = document.body.firstElementChild; vm.c = c // <pre> {{{1
let ma = vm.d.MA
c.textContent += `    Presently using ${ma.getCode()}-${ma.getIssuer()}\n\n`
c.textContent += 'Looking up your SK locally... '
let secret = retrieveItem('secret')
if (secret) {
  c.textContent += 'found.\n'
} else {
  secret = Keypair.random().secret()
  storeItem('secret', secret)
  c.textContent += 'new SK stored.\n'
}
console.log(secret)

let kp = Keypair.fromSecret(secret); vm.d.kp = kp // {{{1
let pk = kp.publicKey()
c.textContent += 'Loading your Stellar TESTNET account... '
vm.e.server.loadAccount(pk).then(account => loaded.call(vm, account))
.catch(error => {
  c.textContent += `${error.message}.\n`
  if (error.message == 'Not Found') {
    c.textContent += 'Creating your Stellar TESTNET account... '
    fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(pk)}`).
    then(response => response.json()).then(json => {
      console.log('new TESTNET account created: txId', json.id)
      c.textContent += 'new account created.\n'
      c.textContent += 'Loading your Stellar TESTNET account... '
    }).then(_ => vm.e.server.loadAccount(pk)).
    then(account => loaded.call(vm, account)).
    catch(error => console.error(error))
  }
})

function loaded (account) { // {{{1
  let { s, e, c, d } = this
  c.textContent += 'loaded.\n'
  if (account.balances.length == 1) {
    c.textContent += 'Updating your trustline... '
    trustAssets.call(this, account, d.kp, '10000', d.MA).then(txId => {
      e.log('trustline updated: txId', txId)
    }).then(_ => e.server.loadAccount(d.kp.publicKey())).then(account => {
      c.textContent += 'updated.\n'
      run.call(this, account)
    })
  } else {
    run.call(this, account)
  }
}

function run (account) { // {{{1
  let { s, e, c, d } = this
  e.log(account)
  d.account = account
  c.textContent += 'Making a buy offer... '
  makeBuyOffer.call(this, d.kp, account, d.MA, d.XLM, '1', '1')
  .then((txId, offerId) => {
    d.offerMade = true
    c.textContent += 'offer made.\n\n'
  })
}

let ob = vm.e.server.orderbook(vm.d.MA, vm.d.XLM).cursor('now')
let stop = _ => {
  vm.c.textContent += 'Your offer has been matched.\n'
  vm.s[0].close()
  vm.c.textContent += `Stream ${vm.s[0].tag} has been closed. DONE.\n`
}
vm.s.push({
  close: ob.stream({
    onerror:   e => { throw e; },
    onmessage: e => {
      console.dir(e, { depth: null })
      vm.d.offerMade && e.bids.length == 0 && stop()
    }
  }),
  tag: 'orderbook',
})

