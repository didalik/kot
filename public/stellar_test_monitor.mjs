import { makeBuyOffer, trustAssets, } from './lib/sdk.mjs' // {{{1
import { Asset, Keypair, Horizon, Networks, TransactionBuilder, } from '@stellar/stellar-sdk'

let vm = { // {{{1
  s: [], 
  e: { log: console.log, nw: Networks.TESTNET,
    server: new Horizon.Server("https://horizon-testnet.stellar.org"),
  }, 
  c: {}, 
  d: { MA: new Asset('MA', 'hx_MA_IssuerPK'), XLM: new Asset('XLM', null), } 
}

let c = document.body.firstElementChild; vm.c = c // <pre> {{{1
let ma = vm.d.MA
c.textContent += `    Presently using ${ma.getCode()}-${ma.getIssuer()}\n\n`
let secret = Keypair.random().secret()
console.log(secret)

let kp = Keypair.fromSecret(secret); vm.d.kp = kp // {{{1
let pk = kp.publicKey()
if (!vm.c.done) {
  c.textContent += 'Loading your Stellar TESTNET account... '
  vm.e.server.loadAccount(pk).then(account => loaded.call(vm, account))
  .catch(error => {
    if (!vm.c.done) {
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
    }
  })
}

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
}

let ob = vm.e.server.orderbook(vm.d.MA, vm.d.XLM).cursor('now') // {{{1
let stop = text => {
  vm.c.textContent += (text + '\n')
  vm.s[0].close()
  vm.c.textContent += `Stream "${vm.s[0].tag}" has been closed. DONE.\n`
  vm.c.done = true
}
vm.s.push({
  close: ob.stream({
    onerror:   e => { throw e; },
    onmessage: e => {
      console.dir(e, { depth: null })
      vm.e.log(vm)
      if (vm.d.account && e.bids.length == 0) {
        vm.c.textContent += 'Trying to start the demo... '
        makeBuyOffer.call(vm, vm.d.kp, vm.d.account, vm.d.MA, vm.d.XLM, '2', '1').then(_ => {
          vm.d.offerMade = true
        })
      } else if (e.bids.length > 0) {
        if (vm.d.offerMade && e.bids[0].amount != '2.0000000') {
          stop('Request to start the demo granted.')
        } else if (!vm.d.offerMade) {
          stop('Someone is running the demo now, please try again in a minute.')
        } else if (e.bids[0].amount != '2.0000000') { // keep looping when e.bids[0].amount == '2.0000000'
          stop('UNEXPECTED')
        }
      }
    }
  }),
  tag: 'orderbook',
})

document.addEventListener("keydown", handleKeyboardEvent) // {{{1

function handleKeyboardEvent (e) { // {{{1
  if (e.ctrlKey && e.key == 'c') {
    stop('You pressed Ctrl-C.')
  }
}
