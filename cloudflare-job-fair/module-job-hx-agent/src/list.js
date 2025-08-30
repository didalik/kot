import * as jobHxDeclarations from './module-job-hx-declaration/list.js' // {{{1

////
// GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ is OU in agent's client SSL certificate
export const GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ = { // {{{1
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
    { name: 'signTaking', // {{{2
      userAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ signTaking userAuth pk', pk)
        return true;
      },
      userDone: (hub, durableObject) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ signTaking userDone hub', hub, 'durableObject', durableObject);
        let sk = hub.parms.get('sk')
        let payload64 = hub.parms.get('payload64')
        return crypto.subtle.importKey(
          'jwk', JSON.parse(sk), 'Ed25519', true, ['sign']
        ).then(sk => crypto.subtle.sign(
          'Ed25519', sk, new TextEncoder().encode(payload64))
        ).then(signature => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ signTaking userDone signature', signature)
          hub.ws.send(signature)
          return Promise.resolve(true);
        });
      },
    },
    { name: 'signTx', // {{{2
      agentAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ signTx agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ signTx userAuth pk', pk)
        return true;
      },
    },
    { name: 'test_signTaking', // {{{2
      agentAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ test_signTaking agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ test_signTaking userAuth pk', pk)
        return true;
      },
    },
    // }}}2
  ],
}

