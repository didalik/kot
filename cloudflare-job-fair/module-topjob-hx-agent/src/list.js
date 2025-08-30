import * as topjobHxDeclarations from './module-topjob-hx-declaration/list.js' // {{{1

////
// GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ is OU in agent's client SSL certificate
export const GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ = { // {{{1
  jobs: [
    { name: 'dopad', // {{{2
      userAuth: (pk, env) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ dopad userAuth pk', pk, 'env', env)
        if (pk != env.hx_ownerPK) {
          throw Error('Not Authorized')
        }
        return true;
      },
      userDone: (hub, durableObject) => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ dopad userDone hub', hub, 'durableObject', durableObject);
        let keys = [], values = []
        for (const key of hub.parms.keys()) {
          keys.push(key)
        }
        for (const value of hub.parms.values()) {
          values.push(value)
        }
        return durableObject[hub.path[5]](keys[0], values[0]);
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

