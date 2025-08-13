import * as jobHxDeclarations from './module-job-hx-declaration/list.js' // {{{1

////
// GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ is OU in agent's client certificate
export const GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ = { // {{{1
  jobs: [
    {
      name: 'selftest',
      agentAuth: pk => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ selftest agentAuth pk', pk)
      },
      userAuth: pk => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ selftest userAuth pk', pk)
        return true;
      },
    },
    {
      name: 'setup_selftest',
      agentAuth: pk => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ setup_selftest agentAuth pk', pk)
      },
      userAuth: pk => {
        console.log('GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ setup_selftest userAuth pk', pk)
        return true;
      },
    },
  ],
}

