/* Copyright (c) 2023-present, Дід Alik and the Kids {{{1
 *
 * This script is licensed under the Apache License, Version 2.0, found in the
 * LICENSE file in the root directory of this source tree.
 * * */

import { Model, Test, View, } from './lib/mvc.mjs' // {{{1
import * as kit from './lib/kit.mjs'

let service = { // {{{1
  description: 'Stellar Help Exchange',
  svcName: 'SVC_NAME', // replace in $DAK_HOME/svc/hex/cfw/src/util.mjs
  svcPK: 'SVC_PK',
}
let user = {
  //guestId: GUEST_ID, // replace in $DAK_HOME/svc/hex/cfw/src/util.mjs ////
  //guestUseSvcUrl: 'GUEST_USE_SVC_URL',                                  //
  //position: { lat: LATITUDE, lng: LONGITUDE },                          //
  //wsUserURL: 'WS_USER_URL', // r=$DAK_HOME/svc/hex/cfw/src/util.mjs //////
}
let config = { // {{{1
  HEX_Issuer_PK: 'STELLAR_HEX_ISSUER_PK', // replace in $r ////
  nw: 'STELLAR_NETWORK',                                     //
  kit, service, 
  //test: false, 
  test: true, 
  user, 
}
console.log(config)

kit.initVm(config).then(vm => Promise.all([
  Model.init(vm, config), 
  Test.init(vm, config),
  View.init(vm, config)
]))
.then(run => Promise.all(run.map(v => v?.run())))
.then(done => Promise.all(done.map(v => v?.done())))
.catch(e => console.error(e)).finally(_ => console.log('DONE vm', window.vm))
