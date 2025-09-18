//// The hX top job kits {{{1
//
// This file lists and exports hX top job kits. A top job kit comprises top jobs.
// Only authorized remote users can request a top job. All top jobs must specify 
// a 'userAuth' function.
//
// A job may require an external agent to run it. Such a job must specify
// an 'agentAuth' function.
//
// If a job can be run internally on the edge, it must specify a 'userDone'
// function.

//// {{{1
// GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ is OU in
// agent's client SSL certificate. It is also being used as a kit ID here:
export const GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ = {
  jobs: [
    { name: 'dopad', // {{{2
      userAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ dopad userAuth pk', pk, 'env', env)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
        return true;
      },
      userDone: (reqst, durableObject, opts) => {
        let keys = [], values = []
        for (const key of reqst.parms.keys()) {
          keys.push(key)
        }
        for (const value of reqst.parms.values()) {
          values.push(value)
        }
        return durableObject[reqst.path[6]](keys[0], values[0]).then(result => {
          console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ dopad userDone reqst', reqst, 'durableObject', durableObject, 'result', result, 'opts', opts)
          reqst.ws.send(`dopad DONE ${result}`)
          reqst.ws.close() // TODO handle result=false
          return Promise.resolve(result);
        })
      },
    },
    { name: 'reset_testnet', // {{{2
      agentAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ reset_testnet agentAuth pk', pk, 'env', env)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ reset_testnet userAuth pk', pk, 'env', env)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
        return true;
      },
    },
    { name: 'reset_testnet_monitor', // {{{2
      agentAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ reset_testnet_monitor agentAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
      },
      userAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ reset_testnet_monitor userAuth pk', pk)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
        return true;
      },
    },
    // }}}2
  ],
}

