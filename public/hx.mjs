/* Copyright (c) 2023-present, Дід Alik and the Kids {{{1
 *
 * This script is licensed under the Apache License, Version 2.0, found in the
 * LICENSE file in the root directory of this source tree.
 * * */

import { Model, Test, View, } from './lib/jc.mjs' // {{{1
import * as kit from './lib/kit.mjs'
//import { post_job, } from './lib/ws.mjs'

let user = {
  position: { lat: LATITUDE, lng: LONGITUDE },
}
let config = { // {{{1
  HEX_Agent_make2map_txids: 'hx_Agent_make2map_txids',
  HEX_Issuer_PK: 'hx_testnet_IssuerPK',
  nw: 'hx_STELLAR_NETWORK',
  kit, 
  test: true, 
  user, 
}
/*
console.log(config, location)

if (config.test) {
  post_job('selftest')
}
*/
kit.initVm(config).then(vm => Promise.all([
  Model.init(vm, config), 
  Test.init(vm, config),
  View.init(vm, config)
]))
.then(run => Promise.all(run.map(v => v?.run())))
.then(done => Promise.all(done.map(v => v?.done())))
.catch(e => console.error(e)).finally(_ => console.log('DONE vm', window.vm))
