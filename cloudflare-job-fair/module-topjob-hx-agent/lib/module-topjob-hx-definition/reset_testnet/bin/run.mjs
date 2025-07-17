#!/usr/bin/env node

function reset_testnet (amountHEXA) { // {{{1
  console.log('reset_testnet amountHEXA', amountHEXA)
  return Promise.resolve();
}

await reset_testnet(process.argv[2]).then(_ => process.exit(0)). // {{{1
  catch(err => {
    console.error(err)
    process.exit(1)
  });
