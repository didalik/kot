//// The hX job kits {{{1
//
// This file lists and exports hX job kits. A kit consists of jobs.
// All remote users can request a job. Still, all jobs must specify 
// a 'userAuth' function.
//
// A job may require an external agent to run it. Such a job must specify
// an 'agentAuth' function.
//
// If a job can be run internally on the edge, it must specify a 'userDone'
// function.

import { uint8ToBase64, } from '../../../public/lib/util.mjs' // {{{1

export const GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ = { // {{{1
// GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ is OU in
// agent's client SSL certificate. It is also being used as a kit ID here.
  jobs: [
    { name: 'selftest', // {{{2
      agentAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ selftest agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: pk => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ selftest userAuth pk', pk)
        return true;
      },
    },
    { name: 'setup_selftest', // {{{2
      agentAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ setup_selftest agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ setup_selftest userAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
        return true;
      },
    },
    // }}}2
  ],
}

export const DEV_KIT = { // {{{1
  jobs: [
    { name: 'sign', // {{{2
      payload2sign: function () { // {{{3
        console.log('DEV_KIT sign payload2sign this', this)
        let payload64 = payload64Edge.call(this)
        crypto.subtle.importKey(
          'jwk', JSON.parse(this.parms.get('sk')), 'Ed25519', true, ['sign']
        ).then(sk => crypto.subtle.sign(
          'Ed25519', sk, new TextEncoder().encode(payload64)
        )).then(signature => send.call(this, payload64, signature)).
          catch(e => console.error(e))
      },
      userAuth: (pk, env) => { // {{{3
        console.log('DEV_KIT sign userAuth pk', pk)
        return true;
      },
      userDone: (that) => { // {{{3
        console.log('DEV_KIT sign userDone that', that)
        let sk = that.parms.get('sk')
        let payload64 = that.parms.get('payload64')
        return crypto.subtle.importKey(
          'jwk', JSON.parse(sk), 'Ed25519', true, ['sign']
        ).then(sk => crypto.subtle.sign(
          'Ed25519', sk, new TextEncoder().encode(payload64))
        ).then(signature => {
          let sig64 = uint8ToBase64(new Uint8Array(signature))
          console.log('DEV_KIT sign userDone sig64', sig64)
          that.ws.send(JSON.stringify({ payload64, sig64 }))
          that.ws.close()
          return Promise.resolve(true);
        });
      }, // }}}3
    },
    { name: 'delegate', // {{{2
      agentAuth: (pk, env) => {
        console.log('DEV_KIT delegate agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('DEV_KIT delegate userAuth pk', pk)
        return true;
      },
    },
    { name: 'test_sign', // {{{2
      agentAuth: (pk, env) => {
        console.log('DEV_KIT test_sign agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('DEV_KIT test_sign userAuth pk', pk)
        return true;
      },
    },

    // }}}2
  ],
}

export const HX_KIT = { // {{{1
  jobs: [
    { name: 'get_txid_pos', // {{{2
      agentAuth: (pk, env) => {
        console.log('HX_KIT get_txid_pos agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('HX_KIT get_txid_pos userAuth pk', pk)
        return true;
      },
    },
    { name: 'issuerSign', // {{{2
      agentAuth: (pk, env) => {
        console.log('HX_KIT issuerSign agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('HX_KIT issuerSign userAuth pk', pk)
        return true;
      },
    },
    { name: 'put_txid_pos', // {{{2
      agentAuth: (pk, env) => {
        console.log('HX_KIT put_txid_pos agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('HX_KIT put_txid_pos userAuth pk', pk)
        return true;
      },
    },
    // }}}2
  ],
}

function payload64Edge () { // {{{1
  return uint8ToBase64(JSON.stringify(
    { jobname: this.job.name, edge: true }
  ));
}

function send (payload64, signature) { // {{{1
  this.ws.send(JSON.stringify(
    { payload64, sig64: uint8ToBase64(new Uint8Array(signature)) }
  ))
}

