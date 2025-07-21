#!/usr/bin/env node

   h_run_agent: async (node, run, job, svc, nwdir, limit, ...args) => { // {{{2
    console.log(job)
    process.env.SVC_NAME = svc
    let agent_keys = nwdir + '/HEX_Agent.keys'
    let creator_keys = nwdir + '.keys'
    let keys = nwdir + '/HEX_Issuer.keys'
    let log = console.log
    let [agentSK, agentPK, origin, noget] =
      await pGET_parms.call(window.crypto.subtle, ...args)
    _originCFW = origin

    let vm = await secdVm(
      loadKeys(keys),       // keysIssuer
      loadKeys(agent_keys), // keysAgent
      log, limit, HEX_FEE, nwdir.endsWith('public'), null, fs
    )
    vm.d.tXs_mapped = []
    vm.d.user = {
      keys:    vm.d.keysAgent,
      account: vm.d.agent,
    }
    addStream.call(vm, 
      "agent's effects", [
        ['account_debited', onClawback],
        //['claimable_balance_claimant_created', onAgentEffect] 
      ],
      vm.d.agent.id //, true
    )
    addStream.call(vm, 
      "issuer's effects", [['claimable_balance_claimant_created', cbcc]]
    )
    _onSIGTERM(vm)
  },

