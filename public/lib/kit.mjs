/* Copyright (c) 2023-present, Дід Alik and the Kids {{{1
 *
 * This script is licensed under the Apache License, Version 2.0, found in the
 * LICENSE file in the root directory of this source tree.
 * * */

import { // {{{1
  description, makeOffer, makeRequest,
  offerTakeDeal, requestTakeDeal,
  parseHEXA, HEX_FEE, HEXA_DISPUTE, takeOffer, takeRequest, toHEXA,
} from './api.mjs'
import {
  clawback,
  createAccount, 
  issuerSign, put_txid_pos,
  secdVm, storeKeys, takeClaimableBalance,
  trustAssets, updateTrustlineAndPay,
} from './sdk.mjs'
import { addStream, cbEffect, postBody, } from './aux.mjs'
import { addLine, retrieveItem, storeItem, } from './util.mjs'
import { JobChannel, Channel, Model, Test, } from './jc.mjs'
import {
  Keypair, MemoHash, MemoText, TransactionBuilder,
} from '@stellar/stellar-sdk'
import { Loader } from '@googlemaps/js-api-loader'
import { apiKey, } from '../../../env.mjs'

let _jc = new JobChannel() // {{{1
let _ns = {}
let _wait4jobs = _ => {
  let resolve, reject, loop = true
  const promise = new Promise(async (res, rej) => {
    resolve = res
    reject = rej
    while (loop) {
      let job = await _jc.receive()
      await job.receive.call(window.vm, job)
    }
    console.log('_wait4jobs DONE')
  })
  promise.then(_ => {
    loop = false;
  })
  return [resolve, reject];
}
let [_wait4jobsResolve, _wait4jobsReject] = _wait4jobs()

const _originCFW = location.origin.startsWith('https:') ? // FIXME do not use _originCFW {{{1
  'https:/svc-hex.didalik.workers.dev'
: 'http://u22:8788'

let _test_steps = [ // {{{1

  // Test step 1: click the Kyiv marker. {{{2
  [lns => { // local name space
    let tx = window.vm.d.tXs_mapped.find(
      v => v.amount == '10' && v.memo == 'Offer 0'
    )
    let marker = tx.marker
    lns.txid = tx.txid
    setTimeout(_ => {
      window.vm.c.core.event.trigger(marker, "click", { 
        domEvent: new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
        latLng: marker.position,
      })
      lns.resolve(true)
    }, 500)
  }, ],

  // Test step 2: click the Kyiv marker InfoWindow Take button. {{{2
  [lns => {
    let button = document.getElementById(lns.txid)
    setTimeout(_ => { button.click(); lns.resolve(true) }, 500)
  }, ],

  // Test step 3: click the Take button (confirm Take Offer). {{{2
  [lns => {
    let button = document.getElementById('confirm-take')
    setTimeout(_ => { button.click(); lns.resolve(false); console.log('Test step 3 lns', lns) }, 500)
  }, ],

  // Test step 4: having taken Offer, wait 5 seconds and close the modal pane. {{{2
  [lns => {
    let button = document.getElementById('takeXX')
    setTimeout(_ => { button.click(); lns.resolve(true); console.log('Test step 4 lns', lns) }, 5000)
  }, ],

  // Test step 5: click the take marker. {{{2
  [lns => { // local name space
    let tx = window.vm.c.latest.deal
    let marker = tx.marker
    lns.txid = tx.txid
    setTimeout(_ => {
      window.vm.c.core.event.trigger(marker, "click", { 
        domEvent: new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
        latLng: marker.position,
      })
      lns.resolve(true)
    }, 500)
  }, ],

  // Test step 6: click the take marker InfoWindow Break button. {{{2
  [lns => {
    let button = document.getElementById(lns.txid)
    setTimeout(_ => { button.click(); lns.resolve(true) }, 500)
  }, ],
  
  // Test step 7: click the Break button (confirm Break Deal). {{{2
  [lns => {
    let button = document.getElementById('confirm-take')
    setTimeout(_ => { button.click(); lns.resolve(false) }, 500)
  }, ],

  // Test step 8: having broken Deal, wait 2 seconds, then close the modal pane {{{2
  // and in 1 more second close the take marker InfoWindow.
  [lns => {
    setTimeout(_ => document.getElementById('takeXX').click(), 2000)
    setTimeout(_ => { 
      window.vm.c.latest.deal.infoWindow.close()
      lns.resolve(false) 
    }, 3000)
  }, ],

  // Test step 9: having seen Broken Deal disputed, wait 2 seconds and click {{{2
  // the Aukland marker.
  [lns => { // local name space
    let tx = window.vm.d.tXs_mapped.find(
      v => v.amount == '10' && v.memo == 'Request 0'
    )
    let marker = tx.marker
    lns.txid = tx.txid
    setTimeout(_ => {
      window.vm.c.core.event.trigger(marker, "click", { 
        domEvent: new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
        latLng: marker.position,
      })
      lns.resolve(true)
    }, 2000)
  }, ],

  // Test step 10: click the Aukland marker InfoWindow Take button. {{{2
  [lns => {
    let button = document.getElementById(lns.txid)
    setTimeout(_ => { button.click(); lns.resolve(true) }, 500)
  }, ],

  // Test step 11: click the Take button (confirm Take Request). {{{2
  [lns => {
    let button = document.getElementById('confirm-take')
    setTimeout(_ => { button.click(); lns.resolve(false) }, 500)
  }, ],

  // Test step 12: having taken Offer, wait 5 seconds and close the modal pane. {{{2
  [lns => {
    let button = document.getElementById('takeXX')
    setTimeout(_ => { button.click(); lns.resolve(true) }, 5000)
  }, ],

  // Test step 13: enable and click the take marker InfoWindow Close button. {{{2
  [lns => {
    let button = document.getElementById(window.vm.c.latest.deal.txid)
    button.disabled = false                                   // enable the button
    setTimeout(_ => { button.click(); lns.resolve(false) }, 500)
  }, ],

  // Test step 14: close the latest deal InfoWindow, click the Make button. {{{2
  [lns => {
    let button = document.getElementById('make-offer-or-request')
    setTimeout(_ => {
      window.vm.c.latest.deal.infoWindow.close()
      button.click(); 
      lns.resolve(true) 
    }, 500)
  }, ],

  // Test step 15: make Request, click the button (confirm Make Request). {{{2
  [lns => {
    setTimeout(_ => { 
      document.getElementById('make-request-radio').checked = true 
    }, 500)
    setTimeout(_ => {
      let fieldset = document.getElementById('make-offer-or-request-fieldset')
      fieldset.lastElementChild.innerHTML = requestCODE_REVIEW_WANTED()
    }, 1000)
    let button = document.getElementById('confirm-take')
    setTimeout(_ => { button.click(); lns.resolve(false) }, 1500)
  }, ],

  // Test step 16: having made Request, wait 9 seconds and close the modal pane. {{{2
  [lns => {
    let button = document.getElementById('takeXX')
    setTimeout(_ => { 
      button.click(); 
      lns.resolve(true) 
    }, 9000)
  }, ],

  // Test step 17: click the newly made Request marker. {{{2
  [lns => { // local name space
    let tx = window.vm.d.tXs_mapped.find(
      v => v.amount == '5000' && v.memo == 'Request 0'
    )
    let marker = tx.marker
    //lns.txid = tx.txid
    setTimeout(_ => {
      window.vm.c.core.event.trigger(marker, "click", { 
        domEvent: new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
        latLng: marker.position,
      })
      lns.resolve(false)
    }, 500)
  }, ],

  // Test step 18: click the taker's take marker InfoWindow Deal button. {{{2
  [lns => {
    let button = document.getElementById(window.vm.c.test.txid)
    setTimeout(_ => { button.click(); lns.resolve(true) }, 500)
  }, ],
  
  // Test step 19: click the Deal button (confirm Deal). {{{2
  [lns => {
    let button = document.getElementById('confirm-take')
    setTimeout(_ => { button.click(); lns.resolve(false) }, 500)
  }, ],

  // Test step 20: close the modal pane, {{{2
  // click the make marker InfoWindow Break button,
  [lns => {
    setTimeout(_ => document.getElementById('takeXX').click(), 1000)
    setTimeout(
      _ => document.getElementById(`${window.vm.c.latest.make.txId}`).click() || lns.resolve(false), 
      2000
    )
  }, ],

  // Test step 21: click the Break button (confirm Break Deal). {{{2
  [lns => {
    let button = document.getElementById('confirm-take')
    setTimeout(_ => { button.click(); lns.resolve(false) }, 500)
  }, ],

  // Test step 22: having broken Deal, wait 2 seconds, then close the modal pane. {{{2
  [lns => {
    setTimeout(_ => document.getElementById('takeXX').click(), 2000)
    lns.resolve(true)
  }, ],

  // Test step FINAL: teardown. {{{2
  [lns => {
    window.vm.c.test?.lock.release()
    stop(18000) // model has run. 20240903
    lns.resolve(true)
  }, ],

  // }}}2
]

let _urlMore = // {{{1
  'https://github.com/didalik/stellar-help-exchange/blob/main/README.md'

const initVm = c => secdVm( // {{{1
  [null, c.HEX_Issuer_PK], // keysIssuer {{{2
  null,                    // keysAgent
  console.log,             // log
  '1000000',               // limit
  HEX_FEE,                 // HEX_FEE
  c.nw == 'public',        // PUBLIC
  c.kit                    // kit
).then(vm => {
  if (c.test) {
    vm.d.HEX_Agent_make2map_txids = c.HEX_Agent_make2map_txids.split(' ')
    vm.d.txids_count = vm.d.HEX_Agent_make2map_txids.length/3
  }
  //console.log('kit.initVm then vm', vm)
  window.vm = vm
  
  document.onclick = event => { // {{{2
    //console.log('document.onclick event', event)

    let closeInitPane = id => id == 'modalRoot' || id == 'welcome2HEXX' // TODO etc
    let makeOfferOrRequest = id => id == 'make-offer-or-request'
    let runSelfTest = id => id == 'run-self-test'
    let _ = closeInitPane(event.target.id) ? _ns?.test.resolve()
    : makeOfferOrRequest(event.target.id) ? ModalPane.make(vm)
    : runSelfTest(event.target.id) ? ModalPane.update(event.target.id)
    : ModalPane.take(vm, event.target.id)
  }

  vm.c.model = new Model(vm) // {{{2
  vm.c.test = c.test ? new Test(vm) : null
  addStream.call(vm, 
    "issuer's effects", 
    [
      ['claimable_balance_claimant_created', cbcc],
      ['claimable_balance_claimed', cbc]
    ]
  )
  // }}}2
  return Promise.resolve(vm)
})

class ModalPane { // {{{1
  constructor (vm) { // {{{2
    this.vm = vm
  }

  show (contentId) { // {{{2
    let background = document.getElementById("modalRoot");
    let content = document.getElementById(contentId)
    background.style.display = "block";
    content.style.display = "block";
    let span = document.getElementById(`${contentId}X`)
    span.onclick = _ => ModalPane.close(contentId)
    
    //console.log('ModalPane.show content', content)

    let onclickP = window.onclick
    window.onclick = event => {
      if (event.target == background && span.style.display == 'block') {
        window.onclick = onclickP
        ModalPane.close(contentId)
      }   
    }
  }

  static close (contentId) { // {{{2
    let background = document.getElementById("modalRoot");
    let content = document.getElementById(contentId)
    background.style.display = "none";
    content.style.display = "none";
  }
 
  static init (vm) { // {{{2
    vm.c.view.modalPane = new ModalPane(vm)
    vm.c.view.modalPane.show('welcome2HEX')
    return vm.c.view;
  }

  static make (vm) { // {{{2
    let [buttonConfirm, content, x, secret, keep] = resetPane('Make')
    let fieldset = document.getElementById('make-offer-or-request-fieldset')
    fieldset.style.display = 'block'
  
    buttonConfirm.onclick = _ => {
      buttonConfirm.disabled = true
      vm.c.view.channel.send(
        [makeX, 
          document.getElementById('make-offer-radio').checked,
          content, x, secret.value, keep.checked
        ]
      ).receive()
    }
  }

  static take (vm, txid) { // {{{2
    let tX = vm.d.tXs_mapped.find(x => x.txid == txid) // {{{3
    if (!tX) { // TODO warning?
      return;
    }
    let takingMyMake = opts => opts.memo_type == MemoHash &&
      opts.memo2str == vm.c?.latest?.make?.txId
    let info = tX.infoWindow.getContent()
    let iwc = typeof info == 'string' ? info : info.innerHTML
    vm.e.log('ModalPane.take tX', tX, 'info', info)

    if (iwc.includes('>Break</button>') && typeof info == 'string') { // FIXME {{{3
      let [buttonConfirm, content, x, secret, keep] = resetPane('Break')
      keep.disabled = true
      secret.disabled = true
      buttonConfirm.onclick = _ => {
        buttonConfirm.disabled = true
        breakX.call(vm, tX, content, x)
      }
      window.vm.c.test?.lock.release()
      return;
    }
    if (iwc && iwc.includes('Close') && // FIXME {{{3
      !tX.offer && tX.txid == vm.c.latest?.deal.txid
    ) {
      iwc = iwc.slice(0, iwc.indexOf('<button')) +
        'Closing Deal...'
      updateInfoWindow(tX.infoWindow, iwc, tX.marker)
      let make = vm.d.tXs_mapped.find(x => x.txid == tX.memo2str)
      toHEXA.call(vm, make.amount, issuerSign).then(_ => {
        iwc = iwc.slice(0, iwc.indexOf('Closing Deal...')) +
          'Deal closed. You got HEXA ' + make.amount
        updateInfoWindow(tX.infoWindow, iwc, tX.marker)
        iwc = make.infoWindow.getContent()
        iwc = iwc.slice(0, iwc.indexOf('Open Deal')) + 'Deal closed.'
        updateInfoWindow(make.infoWindow, iwc, make.marker)
        vm.c.test?.lock.release()
      })
      return;
    }

    if (tX.memo_type == MemoHash) { // Break or Deal {{{3
      let tmm = takingMyMake(tX)
      let tag = tmm ? 'Deal' : 'Break'
      let f = tmm ? dealX : breakX
      let [buttonConfirm, content, x, secret, keep] = resetPane(tag)
      keep.disabled = true
      secret.disabled = true
      buttonConfirm.onclick = _ => {
        buttonConfirm.disabled = true
        vm.c.view.channel.send([f, tX, content, x]).receive()
      }
      return;
    }
    let [buttonConfirm, content, x, secret, keep] = resetPane('Take') // {{{3
    if (!secret.disabled) {
      secret.value = vm.c.test 
        && document.getElementById('run-self-test').checked 
        && document.getElementById('run-self-test-default').checked ?
        Keypair.random().secret()
      : retrieveItem('secret')
    }
    buttonConfirm.onclick = _ => {
      buttonConfirm.disabled = true
      vm.c.view.channel.send(
        [takeX, tX, content, x, secret.value, keep.checked]
      ).receive()
    } // }}}3
  }

  static update (etid) { // {{{2
    let addDefaultCustomAIM = id => {
      let q = document.getElementById(id)
      //console.log('ModalPane.update q', q)

      q.disabled = true
      document.getElementById('welcome2HEXX').style.display = 'none'
      document.getElementById('run-self-test-detail').style.display = 'block'
      document.getElementById('run-self-test-run').onclick = _ => {
        if (document.getElementById('run-self-test-default').checked) {
          localStorage.clear()
          //console.log('ModalPane.update run-self-test-default localStorage cleared')
        }
        ModalPane.close('welcome2HEX')
        console.log('ModalPane.update _ns.test.resolve...')
        _ns.test.resolve()
      }
    }
    let _ = etid == 'run-self-test' ? addDefaultCustomAIM(etid)
    : alert('ModalPane.update event.target.id', etid, 'INVALID')
  }
  // }}}2
}

class User { // {{{1
  constructor (vm, accountORsecret, f = null) { // {{{2
    let { promise, resolve, reject } = Promise.withResolvers()
    this.vm = vm; this.loaded = promise

    let updateTrustlineHEXA = account => { // {{{3
      vm.d.user.account ??= account
      if (!account.balances.find(b => 
        b.asset_code == 'HEXA' && b.is_clawback_enabled
      )) {
        return resolve();
      }
      vm.e.log('new User updateTrustlineHEXA updateTrustlineAndPay.call')
     
      updateTrustlineAndPay.call(vm, 
        vm.d.user.account, Keypair.fromSecret(vm.d.user.keys[0]), 
        vm.d.user.keys[1], '100000', // vm.d.limit == '1000000' 
        vm.d.HEXA, vm.d.keysIssuer[1], issuerSign
      ).then(_ => resolve())
    }

    let loaded = account => { // {{{3
      let pk = vm.d.user.keys[1]
      addStream.call(vm, 
        "user's effects", 
        [
          ['claimable_balance_claimant_created', onUserEffect],
          ['claimable_balance_claimed', onUserEffect]
        ],
        pk, true
      )
      vm.d.user.account ??= account
      if (account.balances.length >= 3) { 
        return updateTrustlineHEXA(account);
      }
      vm.e.log('new User loaded trustAssets.call')
     
      trustAssets.call(vm, account, Keypair.fromSecret(vm.d.user.keys[0]),
        vm.d.limit, vm.d.ClawableHexa, vm.d.HEXA
      ).then(_ => vm.e.server.loadAccount(pk))
      .then(account => updateTrustlineHEXA(account))
    }
    // }}}3
    if (f) {
      let secret = accountORsecret
      let pk = Keypair.fromSecret(secret).publicKey()
      vm.d.user.keys = [secret, pk]
      vm.e.log('new User createAccount.call')
     
      f.call(vm).then(kp => createAccount.call(vm, pk, '10', {}, kp))
      .then(txId => vm.e.server.loadAccount(pk))
      .then(account => loaded(account))
    } else {
      loaded(accountORsecret)
    }
  }

  breakDeal (tX) { // {{{2
    let { s, e, c, d } = this.vm
    let make = d.tXs_mapped.find(v => v.txid == tX.memo2str)
    e.log('User breakDeal tX', tX, 'c.latest', c.latest)

    let amount = make ? make.amount : tX.amount
    return clawback.call(this.vm,
      d.user.account, Keypair.fromSecret(d.user.keys[0]), 
      c.latest.deal.tx ? c.latest.deal.tx.id : c.latest.deal.opts.tx.id,
      amount, 
      make ? make.pk : c.latest.deal.opts.tx.source_account,
      issuerSign
    ).then(r => {
      let info = tX.infoWindow.getContent()
      let str = typeof info == 'string'
      let content = str ? info : info.innerHTML
      e.log('User breakDeal r', r, 'content', content, 'str', str)

      content = content.slice(0, content.indexOf(str ? 'Deal.' : '<button')) +
        'You broke this deal and got HEXA ' + amount + ' back.'
      updateInfoWindow(tX.infoWindow, content, tX.marker)
      tX.marker.content = new c.marker.PinElement({
        background: str ? 'aqua' : "red",
        borderColor: "silver",
        glyphColor: str ? 'red' : "lime",
      }).element
      if (str) {
        let take = d.tXs_mapped.find(v => v.txid == c.latest.deal.opts.tx.id)
        d.tXs_mapped.push({ txid: r.txId, take })
        e.log('User breakDeal take', take)

        content = take.infoWindow.getContent()
        content = content.slice(0, content.indexOf('Deal')) + 'Broken Deal'
        updateInfoWindow(take.infoWindow, content, take.marker)
      } else {
        content = make.infoWindow.getContent()
        content = content.slice(0, content.indexOf('Open Deal')) + 'Broken Deal'
        updateInfoWindow(make.infoWindow, content, make.marker)
      }
      c.test?.lock.release()
      return Promise.resolve('done.');
    })
  }

  make (tX, claim = true) { // {{{2
    let { s, e, c, d } = this.vm
    let f = tX.kind == 'Offer' ? makeOffer : makeRequest
    let desc = tX.desc.replaceAll('&lt;', '<').replaceAll('&gt;', '>')

    return this.loaded.then(_ => {
      f.call(this.vm,
        d.user.account, Keypair.fromSecret(d.user.keys[0]), desc
      ).then(r => {
        c.latest ??= {}
        c.latest.make = {
          amount: parseHEXA(desc),
          balanceId: r.balanceId, 
          offer: tX.kind == 'Offer', 
          txId: r.txId 
        }
        e.log('User make claim', claim, 'tX', tX, 'r', r)

        let pos = [d.user.position.lat, d.user.position.lng]
        _jc.send([this.vm, push_txid_pos, r.txId, pos])
      })
      return Promise.resolve('in progress.');
    });
  }

  openDeal (tX) { // {{{2
    let { s, e, c, d } = this.vm
    let make = d.tXs_mapped.find(v => v.txid == tX.memo2str)
    tX.opts.issuerSign = issuerSign 
    e.log('User openDeal tX', tX, 'make', make)

    let f = tX.offer ? offerTakeDeal : requestTakeDeal
    return f.call(this.vm, tX.opts).then(r => {
      tX.deal = {}; tX.deal.txid = r.txId
      pushDeal.call(this.vm, make, tX, tX.deal)
      if (tX.offer) {
        return Promise.resolve('done.');
      }
      let content = make.infoWindow.getContent() //.innerHTML FIXME
      e.log('User openDeal r', r, 'content', content)
 
      content = content.slice(0, content.indexOf('<button')) +
        'Deal. You paid HEXA ' + make.amount + ' for your request.' +
        `<button class='take' id='${make.txid}'>Break</button>`
      updateInfoWindow(make.infoWindow, content, make.marker)
      make.marker.content = new c.marker.PinElement({
        background: 'aqua',
        borderColor: "silver",
        glyphColor: "silver",
      }).element
      content = tX.infoWindow.getContent().innerHTML
      content = content.slice(0, content.indexOf('<button')) + 'Deal'
      updateInfoWindow(tX.infoWindow, content, tX.marker)
      tX.marker.content = new c.marker.PinElement({
        background: 'silver',
        borderColor: "aqua",
        glyphColor: "aqua",
      }).element
      return Promise.resolve('done.');
    })
  }

  take (tX, claim = true) { // {{{2
    let { s, e, c, d } = this.vm

    return this.loaded.then(async _ => {
      //e.log('User take claim', claim, 'tX', tX)

      let balanceIds = _ => { // {{{3
        let bIds = retrieveItem('balanceIds')
        if (!bIds) {
          bIds = []
          storeItem('balanceIds', bIds)
        }
        return d.user.balanceIds = bIds;
      }

      let claimNoDeals = async (bIds, kp) => { // {{{3
        let claimed = []
        for (let balanceId of bIds) {
          let r = await takeClaimableBalance.call(this.vm, 
            d.user.account, kp, balanceId
          )
          r && claimed.push(r.balanceId)
        }
        e.log('take claimNoDeals claimed', claimed)

        return Promise.resolve(claimed);
      }

      let dropClaimedBalanceIds = bIds => { // {{{3
        while (true) {
          let index
          if ((index = d.user.balanceIds.findIndex(
            v => bIds.findIndex(w => w == v) > -1
          )) == -1) {
            break
          }
          d.user.balanceIds.splice(index, 1)
        }
      }

      // }}}3
      let kp = Keypair.fromSecret(d.user.keys[0])

      if (claim) {
        await claimNoDeals(balanceIds(), kp)
        .then(claimed => dropClaimedBalanceIds(claimed))
      }

      let job = tX.memo.startsWith('Offer') ? [
        takeOffer,   d.user.account, kp, tX.txid, tX.amount 
      ] : [
        takeRequest, d.user.account, kp, tX.txid
      ]
      let f = job.shift()
      return f.call(this.vm, ...job).then(r => {
        e.log('User take f.call r', r)

        let pos = [d.user.position.lat, d.user.position.lng]
        _jc.send([this.vm, push_txid_pos, r.txId, pos])
        c.latest ??= {}
        c.latest.take ??= {}
        c.latest.take.balanceId = r.balanceId
        put_txid_pos(r.txId, pos).
          then(text => e.log('User take put_txid_pos', text))
        d.user.balanceIds ??= []
        d.user.balanceIds.push(r.balanceId)
        return Promise.resolve('in progress.');
      });
    })
  }
  // }}}2
}

function addMxButton () { // {{{1
  let { s, e, c, d } = this
  const buttonMx = document.createElement("button")
  buttonMx.id = 'make-offer-or-request'
  buttonMx.textContent = 'Make'
  buttonMx.title = 'Make Offer or Request'
  buttonMx.type = 'button'
  //buttonMx.addEventListener('click', _ => alert('XA')) // this one runs first,
  // then document.onclick runs.

  const divMx = document.createElement("div")
  divMx.appendChild(buttonMx)
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(divMx)
}

function addTakeButton2Desc (x) { // {{{1
  let b = x.txid == window.vm.c?.latest?.make.txId ? 'Cancel' : 'Take'
  let suffix = '<br/>\n'
  x.header = x.desc.slice(0, x.desc.indexOf(suffix))
  x.desc += `<hr/><button class='take' id='${x.txid}'>${b}</button>`
  x.desc = x.desc.slice(x.header.length + suffix.length)
}

function breakX (tX, content, x) { // {{{1
  let { s, e, c, d } = this 
  d.opts = { content }
  x.style.display = 'none'
  content.appendChild(document.createTextNode('breaking Deal... '))

  let resolve = _ => {
    x.style.display = 'block'
  }
  e.server.loadAccount(d.user.keys[1])
  .then(account => new User(this, account).breakDeal(tX))
  .then(r => addLine(content, r))
  .catch(e => unexpected(e))
  .finally(_ => resolve())
}

async function cbc (effect) { // claimable_balance_claimed {{{1
  let { s, e, c, d } = this
  cbEffect.call(this, { effect, }).then(deal => {
    e.log('cbc cbEffect deal', deal, this)

    if (effect.balance_id != c?.latest?.take.balanceId) {
      return;
    }
    let take = d.tXs_mapped.find(v => v.txid == deal.data.memo2str)
    if (take) {
      let make = d.tXs_mapped.find(v => v.txid == take.memo2str) // {{{2
      take.deal = deal
      e.log('cbc cbEffect take', take, 'make', make, 'deal txid', deal.tx.id)

      let line2add = 'You took this ' + (
        effect.amount != HEX_FEE ? ('offer and paid HEXA ' + effect.amount)
        : ('request and received ClawableHexa ' + make.amount)
      )
      addLine(d.opts.content, line2add)

      let content = make.infoWindow.getContent() // {{{2
      content = content.slice(0, content.indexOf('<button')) + 'Open Deal'
      updateInfoWindow(make.infoWindow, content, make.marker)
      let makeColor = make.offer ? "lime" : "aqua"
      make.marker.content = new c.marker.PinElement({
        background: makeColor,
        borderColor: "silver",
        glyphColor: "silver",
      }).element
      take.marker.content = new c.marker.PinElement({ // {{{2
        background: "silver",
        borderColor: makeColor,
        glyphColor: makeColor,
      }).element
      content = document.createElement('span')
      let dealBreak = `Deal. You paid HEXA ${make.amount} for this offer.` +
        `<hr/><button class='take' id='${take.txid}'>Break</button>`
      let dealClose = `Deal. You got ClawableHexa ${make.amount} for this request.` +
        `<hr/><button disabled class='take' id='${take.txid}'>Close</button>`
      content.innerHTML = make.offer ? dealBreak : dealClose
      updateInfoWindow(take.infoWindow, content, take.marker)
      let line = new c.maps.Polyline({ // {{{2
        path: [make.position, take.position],
        geodesic: true,
        strokeColor: makeColor,
        strokeOpacity: 1.0,
        strokeWeight: 2
        })
      line.setMap(map) // }}}2
      pushDeal.call(this, make, take, deal)
    }
  })
}

function cbcc (effect) { // claimable_balance_claimant_created {{{1
  let { s, e, c, d } = this
  let breakMyRequest = opts => d.tXs_mapped.find(v => v.txid == opts.data.memo2str) // {{{2

  let map_tX = tX => { // {{{2
    let [pos, opts] = [tX[1], tX[2]]
    if (pos.length == 0) {
      return; // closing
    }
    let x = opts.data ? opts.data : {}
    x.opts = opts; x.txid = tX[0]; x.memo = opts.tx.memo
    x.position = { lat: pos[0], lng: pos[1] }
    let f = x.memo_type == MemoText ? x.memo.startsWith('Offer') ? markOfferMade 
      : markRequestMade
      : markTaking
    f.call(this, x)
    //e.log('cbcc map_tX x', x)

    d.tXs_mapped.push(x)
  }
  let takingMyMake = opts => opts.data.memo_type == MemoHash && opts.data.memo2str == c?.latest?.make?.txId // {{{2

  // }}}2
  cbEffect.call(this, { effect, }).then(async opts => {
    opts.data.memo_type = opts.tx.memo_type // FIXME what? why?
    if (effect.amount == HEXA_DISPUTE) { // {{{2
      //e.log('cbcc effect.amount == HEXA_DISPUTE cbEffect opts', opts)

      let bmr = breakMyRequest(opts)
      if (bmr) {
        e.log('cbcc effect.amount == HEXA_DISPUTE cbEffect bmr', bmr)

        let content = bmr.take.infoWindow.getContent()
        content += ' disputed.'
        updateInfoWindow(bmr.take.infoWindow, content, bmr.take.marker)
        bmr.take.marker.content = new c.marker.PinElement({
          background: "silver",
          borderColor: "aqua",
          glyphColor: "maroon",
        }).element
        return;
      }
      let make = d.tXs_mapped.find(v => v.txid == c.latest.deal.memo2str)

      let content = make.infoWindow.getContent()
      content += ' disputed.'
      updateInfoWindow(make.infoWindow, content, make.marker)
      make.marker.content = new c.marker.PinElement({
        background: "lime",
        borderColor: "silver",
        glyphColor: "maroon",
      }).element

      c.test?.lock.release()
      return;
    } 

    if (takingMyMake(opts)) { // {{{2
      e.log('cbcc cbEffect takingMyMake(opts) opts', opts)

      let txid = opts.tx.id
      fetch(_originCFW + '/get_txid_pos', { method: 'POST', body: txid, })
      .then(response => response.json())
      .then(pos => _jc.send([this, push_txid_pos, txid, pos]))
      .then(sent => e.log('cbcc cbEffect takingMyMake fetch pos sent', sent))

      _jc.send([this, push_opts, opts])
      .then(sent => e.log('cbcc cbEffect takingMyMake opts sent', sent))

      return;
    }

    // }}}2
    let txidIdx = d.HEX_Agent_make2map_txids.findIndex(e => e == opts.tx.id)
    let [txId, latitude, longitude] = 
      d.HEX_Agent_make2map_txids.slice(txidIdx, txidIdx + 3)
    d.tXs.push([txId, [+latitude, +longitude], opts])
    if (++d.tXs_read == vm.d.txids_count) { // Model is initialized.
      if (!c.view.initialized) {
        //e.log('cbcc wait for View.init')
        let { promise, resolve, reject } = Promise.withResolvers()
        let result = true
        _ns.view = { resolve, result }
        await promise // wait for View.init
      }
      for (let tX of d.tXs) {
        map_tX(tX)
      }
      c.model.initialized = true
      c.model.channel.receive()
      //e.log('cbcc model initialized this', this)
      _ns.model.resolve(_ns.model.result)
    }
  })
}

function cKP () { // {{{1
  let { s, e, c, d } = this
  if (!e.nw.startsWith('Test')) {
    console.error('TODO Stellar public network')
    throw 'FIXME';
  }
  let [HEX_CREATOR_SK, HEX_CREATOR_PK] = storeKeys.call(this)
  return fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(HEX_CREATOR_PK)}`
  ).then(response => response.json()).then(responseJSON => {
    e.log('HEX_CREATOR account created txId', responseJSON.id)
    return e.server.loadAccount(HEX_CREATOR_PK);
  }).then(account => {
    e.log('loaded HEX_CREATOR', account.id)
    c.account = account
    d.keys = [HEX_CREATOR_SK, HEX_CREATOR_PK]
    return Promise.resolve(d.kp = Keypair.fromSecret(HEX_CREATOR_SK));
  });
}

function dealX (tX, content, x) { // {{{1
  let { s, e, c, d } = this 
  d.opts = { content }
  x.style.display = 'none'
  content.appendChild(document.createTextNode('opening Deal... '))

  let resolve = _ => {
    x.style.display = 'block'
  }
  /*
  */
  e.server.loadAccount(d.user.keys[1])
  .then(account => new User(this, account).openDeal(tX))
  .then(r => addLine(content, r))
  .catch(e => unexpected(e))
  .finally(_ => resolve())
}

function decodeX (q) { // {{{1
  let { s, e, c, d } = this
  if (!c.view.initialized) {
    return;
  }
  while (true) {
    let index
    if ((index = q.findIndex(v => v.length > 2)) == -1) {
      break
    }
    let tx = q.splice(index, 1)[0]
    //e.log('decodeX tx', tx)

    let x = tx[1].length == 2 ? tx[2] : tx[1]
    x.txid = tx[0]
    x.position = {
      lat: tx[1].length == 2 ? tx[1][0] : tx[2][0],
      lng: tx[1].length == 2 ? tx[1][1] : tx[2][1]
    }
    let f = x.memo_type == MemoText ? x.memo.startsWith('Offer') ? markOfferMade 
      : markRequestMade
      : markTaking
    f.call(this, x)
    //e.log('decodeX f', f, 'x', x)

    d.tXs_mapped.push(x)
  }
}

function doneModel (resolve, reject) { // {{{1
  let { s, e, c, d } = this
  while (s.length > 0) {
    let effects = s.shift()
    effects.close()
    e.log('closed', effects.tag)
  }
  resolve(c.model)
}

function doneTest (resolve, reject) { // {{{1
  let { s, e, c, d } = this
  resolve(c.test)
}

function doneView (resolve, reject) { // {{{1
  let { s, e, c, d } = this
  resolve(c.view)
}

function encodeX (queue) { // {{{1
  let { s, e, c, d } = this
  while (queue.length > 0) {
    let x = queue.shift()
    //e.log('encodeX x', x)

    let f = x.shift()
    f.call(this, ...x)
  }
}

function initModel (config, resolve, reject) { // {{{1
  // Model is initialized when all d.old_tXs_length tXs have been read. {{{2
  // A tX is either
  //
  //           [ txid, [ lng, lat ], { amount, desc, memo, memo_type, pk } ]
  // or
  //           [ txid, { amount, desc, memo, memo_type, pk }, [ lng, lat ] ]
  // array. }}}2
  let { s, e, c, d } = this
  Object.assign(c.model, { resolve, reject })
  Object.assign(d, 
    { tXs: [], tXs_mapped: [], tXs_read: 0, user: config.user }
  )
  _ns.model = { resolve, result: c.model }
  /*
  fetch(d.user.guestUseSvcUrl, { method: 'GET', }).then(response => response.json())
  .then(json => {
    //e.log('initModel json', json)

    d.old_tXs_length = json.taken.length
    for (let tX of json.taken) {
      _jc.send([this.vm, push_txid_pos, tX[0], tX[1]])
    }
    if (d.tXs_read == d.old_tXs_length) { // Model is initialized.
      c.model.initialized = true
      //e.log('initModel c.model.initialized true this', this)

      c.model.channel.receive() // see https://go.dev/tour/concurrency/2
      resolve(c.model)
    }
  }).catch(err => console.error('initModel err', err))
  */
}

function initTest (config, resolve, reject) { // {{{1
  let { s, e, c, d } = this
  if (!config.test) {
    c.test = null
  }
  //e.log('initTest resolve...')
  resolve(c.test)
}

function initView (config, resolve, reject) { // {{{1
  let { s, e, c, d } = this
  const loader = new Loader({ apiKey, version: "weekly", })
  const mapOptions = {
    center: d.user.position,
    mapId: "Stellar_HEX_MAP_ID",
    mapTypeId: "OSM",
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 2
  };
  loader.load().then(g => {
    map = new g.maps.Map(document.getElementById("map"), mapOptions);
    let mapTypeOSM = new g.maps.ImageMapType({
      getTileUrl: function(coord, zoom) {
        return `https://tile.openstreetmap.org/${zoom}/${coord.x}/${coord.y}.png`;
      },
      tileSize: new g.maps.Size(256, 256),
      name: "OpenStreetMap",
      maxZoom: 18
    })
    map.mapTypes.set("OSM", mapTypeOSM)
    return google.maps.importLibrary('marker');
  }).then(r => {
    c.marker = r
    return google.maps.importLibrary('core');
  }).then(r => {
    c.core = r
    return google.maps.importLibrary('maps');
  }).then(r => {
    c.maps = r
    addMxButton.call(this)

    c.view.initialized = true
    _ns.view && _ns.view.resolve(_ns.view.result)
    /*_ns.view || */ c.model.channel.receive()
    //e.log('initView _ns', _ns)

    resolve(ModalPane.init(this))
  })
  .catch(e => { console.error(e); }); 
}

function makeX (offer, content, x, secret, keep) { // {{{1
  let { s, e, c, d } = this // {{{2
  x.style.display = 'none'
  let desc = document.getElementById('make-offer-or-request-textarea').innerHTML
  let kind = offer ? 'Offer' : 'Request'
  let opts = { desc, kind }
  content.appendChild(document.createTextNode(`making ${kind}... `))
  keep && storeItem('secret', secret)

  let resolve = _ => { // {{{2
    x.style.display = 'block'
    c.test?.lock.release()
  }

  userX.call(this, 'make', resolve, content, secret, keep, opts) // {{{2

  // }}}2
}

function mark (position, title, pe, iwhc, iwc) { // {{{1
  let { s, e, c, d } = this
  const marker = new c.marker.AdvancedMarkerElement({ 
    map, position, title, content: pe.element
  });
  const infoWindow = new c.maps.InfoWindow()
  let header = document.createElement('span')
  if (typeof iwhc == 'string') {
    header.innerHTML = iwhc
  } else {
    header = iwhc
  }
  infoWindow.close()
  infoWindow.setContent(iwc); infoWindow.setHeaderContent(header)
  
  marker.addListener('click', ({ domEvent, latLng }) => {
    const { target } = domEvent // target.position === position
    infoWindow.open(marker.map, marker)
  })
  return { infoWindow, marker };
}

function markOfferMade (x) { // {{{1
  let { s, e, c, d } = this
  addTakeButton2Desc(x)
  let pe = new c.marker.PinElement({
    background: "lime",
    borderColor: "silver",
    glyphColor: "white",
  })
  Object.assign(x, mark.call(this, x.position, x.pk, pe, x.header, x.desc))
}

function markRequestMade (x) { // {{{1
  let { s, e, c, d } = this
  addTakeButton2Desc(x)
  let pe = new c.marker.PinElement({
    background: "aqua",
    borderColor: "silver",
    glyphColor: "white",
  })
  Object.assign(x, mark.call(this, x.position, x.pk, pe, x.header, x.desc))
}

function markTaking (x) { // {{{1
  let { s, e, c, d } = this
  let make = d.tXs_mapped.find(v => v.txid == x.memo2str)
  let takerIsMe = pos => 
    pos.lat == d.user.position.lat && pos.lng == d.user.position.lng
  e.log('markTaking x', x, 'make', make)

  //c.countTakes ??= 1
  let pe = new c.marker.PinElement({ // {{{2
    background: "silver",
    borderColor: make.offer ? "lime" : "aqua",
    glyphColor: "white",
    //glyph: `${c.countTakes++}`,
    //scale: 0.8,
  })
  let header = document.createElement('span')
  header.innerHTML = make.infoWindow.getHeaderContent().innerHTML
  let info = `Taking ${make.offer ? "Offer" : "Request"}...`
  Object.assign(x, mark.call(this, x.position, make.pk, pe, header, info))
  if (takerIsMe(x.position)) {
    return;
  }
  let line = new c.maps.Polyline({ // {{{2
    path: [x.position, make.position],
    geodesic: true,
    strokeColor: 'silver',
    strokeOpacity: 1.0,
    strokeWeight: 2
    })
  line.setMap(map)
  let content = document.createElement('span')
  let deal = `Taking your ${x.offer ? 'Offer' : 'Request'}` +
    `<hr/><button class='take' id='${x.txid}'>Deal</button>`
  content.innerHTML = deal
  updateInfoWindow(x.infoWindow, content, x.marker)
  c.test && Object.assign(c.test, { txid: x.txid })
  c.test?.lock.release()

  // }}}2
}

async function onUserEffect (effect) { // claimable_balance_claimant_created {{{1
  let { s, e, c, d } = this
  e.log('onUserEffect effect', effect)

}

function pushDeal (make, take, deal) { // {{{1
  let { s, e, c, d } = this
  make.deals ??= []
  make.deals.push(take)
  c.latest.deal = take
  c.latest.deal.tx = deal.tx
  c.test?.lock.release()
}

function push_opts (queue, opts) { // {{{1
  let { s, e, c, d } = this
  let txid = opts.tx.id
  let index = queue.findIndex(v => v.data[0] == txid)
  e.log('push_opts queue', queue, 'opts', opts, 'index', index)

  if (index == -1) {
    queue.push({ data: [txid, opts] })
    return false;
  }
  queue[index].data.push(opts)
  queue[index].sent = true
  queue[index].receive = uxMapTx
  return true;
}

function push_txid_pos (queue, txid, pos) { // {{{1
  let { s, e, c, d } = this
  let index = queue.findIndex(v => v.data[0] == txid)
  e.log('push_txid_pos queue', queue, 'txid', txid, 'pos', pos)

  if (index == -1) {
    queue.push({ data: [txid, pos] })
    return false;
  }
  queue[index].data.push(pos)
  queue[index].sent = true
  queue[index].receive = uxMapTx
  return true;
}

function receiveJobs (q) { // {{{1
  let { s, e, c, d } = this
  if (!c.view.initialized) {
    return;
  }
  //e.log('receiveJobs q', q)

  while (true) {
    let index
    if ((index = q.findIndex(v => Test.isJob(v))) == -1) {
      break
    }
    let job = q.splice(index, 1)[0]
    //e.log('receiveJobs job', job)

    let f = job.shift()
    f.call(this, ...job)
  }
}

function requestCODE_REVIEW_WANTED () { // {{{1
  let hash = '#stellar-hex-code-review-wanted'
  return `<b>Stellar HEX CODE REVIEW WANTED</b><br/>
Paying HEXA 5000. 
<a href='${_urlMore}${hash}' target='_blank'>More...</a>`;
}

function resetPane (v) { // {{{1
  let content = document.getElementById('takeX')
  let x = document.getElementById('takeXX')
  x.style.display = 'block'
  let secret = document.getElementById('stellar-secret')
  let keep = document.getElementById('keep-secret-locally')
  keep.checked = true
  let buttonConfirm = document.getElementById('confirm-take')
  buttonConfirm.disabled = false
  window.vm.c.view.modalPane.show('takeX')
  
  buttonConfirm.lastChild.data = v
  while (content.lastChild.nodeName != 'DIV') {
    content.removeChild(content.lastChild)
  }
  let fieldset = document.getElementById('make-offer-or-request-fieldset')
  fieldset.style.display = v == 'Make' ? 'block' : 'none'
  console.log('resetPane content', content)

  return [buttonConfirm, content, x, secret, keep];
}

function runModel (resolve, reject) { // {{{1
  let { s, e, c, d } = this
  _ns.model = { resolve, result: c.model }

}

async function runTest (resolve, reject) { // {{{1
  let { s, e, c, d } = this
  await new Promise((resolve, reject) => { // wait for ModalPane to close
    _ns.test = { resolve, reject }
  })
  if (!document.getElementById('run-self-test').checked) {
    resolve(c.test)
    return;
  }

  let lns = {} // local name space
  for (let step of _test_steps) {
    //e.log('runTest step', step)
    await c.test.lock.acquire().then(_ => new Promise((resolve, reject) => {
      step.push(Object.assign(lns, { resolve }))
      c.test.channel.send(step).receive()
    })).then(now => {
      e.log('runTest now', now)

      now && c.test?.lock.release()
    })
  }
  //e.log('runTest resolving...')
  resolve(c.test)
}

function runView (resolve, reject) { // {{{1
  let { s, e, c, d } = this
  let x = document.getElementById("welcome2HEXX")
  x.style.display = "block";

  resolve(c.view)
}

function sendItems (item, queue) { // {{{1
  let { s, e, c, d } = this
  Test.isJob(item) && queue.push(item)
  //e.log('sendItems item', item, 'queue', queue)
}

function stop (timeout) { // {{{1
  setTimeout(_ => {
    _wait4jobsResolve()
    _jc.send([window.vm, push_txid_pos, 'txid', []])
    .then(_ => _jc.send([window.vm, push_txid_pos, 'txid', []]))
    _ns.model.resolve(_ns.model.result) 
  }, timeout)
}

function takeX (tX, content, x, secret, keep) { // {{{1
  let { s, e, c, d } = this // {{{2
  x.style.display = 'none'
  let kind = tX.memo.split(' ')[0]
  content.appendChild(document.createTextNode(`taking ${kind}... `))
  keep && storeItem('secret', secret)

  let resolve = _ => { // {{{2
    storeItem('balanceIds', d.user.balanceIds)
    x.style.display = 'block'
  }

  userX.call(this, 'take', resolve, content, secret, keep, tX) // {{{2

  // }}}2
}

function unexpected (error) { // {{{1
  console.error('unexpected error', error)
  window.vm.c.test?.lock.release()
  stop(1000)
}

function updateInfoWindow (w, c, m) { // {{{1
  w.close()
  w.setContent(c)
  w.open(m.map, m)
}

function userX (type, resolve, content, secret, keep, tX = null) { // {{{1
  let { s, e, c, d } = this // {{{2

  let UNEXPECTED = e => { // {{{2
    console.error(e.message)
    throw e;
  }

  let kp = Keypair.fromSecret(secret) // {{{2
  let pk = kp.publicKey()
  d.user.keys ??= [secret, pk]
  d.opts = { content }

  e.server.loadAccount(pk).then(
    account => new User(this, account)[type](tX, false))
  .catch(
    e => e.message == 'Not Found' ? new User(this, secret, cKP)[type](tX, false)
    : UNEXPECTED(e)
  ).then(r => addLine(content, r))
  .catch(e => unexpected(e))
  .finally(_ => resolve())

  // }}}2
}

async function uxMapTx (job) { // {{{1
  let { s, e, c, d } = this // {{{2

  e.log('uxMapTx job', job)

  let data = async job => { // {{{2
    let [pos, opts] = job.data[1].length == 2 ? [job.data[1], job.data[2]]
    : [job.data[2], job.data[1]]
    if (pos.length == 0) {
      return [false, false];
    }
    if (_ns.view) {
      delete _ns.view
    } else {
      let { promise, resolve, reject } = Promise.withResolvers()
      let result = true
      _ns.view = { resolve, result }
      await promise // wait for View.init
    }
    let x = opts.data ? opts.data : {}
    x.opts = opts
    x.txid = job.data[0]
    x.memo = opts.tx.memo
    x.position = { lat: pos[0], lng: pos[1] }
    let f = x.memo_type == MemoText ? x.memo.startsWith('Offer') ? markOfferMade 
      : markRequestMade
      : markTaking
    return [x, f];
  }

  let [x, f] = await data(job) // {{{2
  if (!x) {
    return; // closing
  }
  f.call(this, x)
  d.tXs_mapped.push(x)
  e.log('uxMapTx d', d)

  // }}}2
}

export { // {{{1
  decodeX, 
  doneModel, doneTest, doneView,
  encodeX,
  initModel, initTest, initView, initVm, 
  receiveJobs,
  runModel, runTest, runView,
  sendItems
}
