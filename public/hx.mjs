/* Copyright (c) 2023-present, Дід Alik and the Kids {{{1
 *
 * This script is licensed under the Apache License, Version 2.0, found in the
 * LICENSE file in the root directory of this source tree.
 * * */

import { Model, Test, View, } from './lib/jc.mjs' // {{{1
import * as kit from './lib/kit.mjs'
import { post_job, post_job_args, } from './lib/jf1.mjs'

let user = {
  position: { lat: LATITUDE, lng: LONGITUDE },
}
let config = { // {{{1
  HEX_Agent_make2map_txids: 'hx_Agent_make2map_txids',
  HEX_Issuer_PK: 'hx_testnet_IssuerPK',
  HX_SERVICES_ID: 'GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ', // FIXME
  nw: 'hx_STELLAR_NETWORK',
  kit, 
  test: true, 
  user,
  userKeys: 'hx_userKeys', // TODO generate job fair sk & pk in the browser
}
window.config = config
/*
console.log(config, location)

if (config.test) {
  for (let i = 0; i < 3; i++) {
    post_job(
      post_job_args(
        'DEV_KIT',
        'hx/test_sign',
        decodeURIComponent(config.userKeys)
      )
    )
  }
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
