import { fileURLToPath } from 'url' // {{{1
import { dirname } from 'path'
import { spawn } from 'node:child_process'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ = { // {{{1
  reset_testnet: function (opts) { return reset_testnet.call(this, opts); },
  reset_testnet_monitor: function (opts) { return reset_testnet_monitor.call(this, opts); },
}

function reset_testnet (opts) { // {{{1
  let amountHEXA = opts.args[0] ? opts.args[0].toString() : null
  let job = spawn(
    `${__dirname}/module-topjob-hx-definition/reset_testnet/bin/job`,
    amountHEXA ? [amountHEXA] : [],
    { cwd: `${__dirname}/module-topjob-hx-definition/reset_testnet` }
  )
  job.on('error', err => console.error(`E R R O R  ${err}`))
  job.stderr.on('data', data => console.error('reset_testnet stderr', data.toString()))
  job.stdout.on('data', data => {
    this.ws.send(data)
  })
  job.on('close', code => {
    this.ws.send(`reset_testnet EXIT CODE ${code}`)
    this.ws.close()
  })
}

function reset_testnet_monitor (amountMA = '10000') { // TODO drop default value {{{1
  let job = spawn(
    `${__dirname}/module-topjob-hx-definition/reset_testnet_monitor/bin/job`,
    [amountMA, '../reset_testnet/build/testnet'],
    { cwd: `${__dirname}/module-topjob-hx-definition/reset_testnet_monitor` }
  )
  job.on('error', err => console.error(`E R R O R  ${err}`))
  job.stderr.on('data', data => log('reset_testnet_monitor stderr', data.toString()))
  job.stdout.on('data', data => {
    this.ws.send(data)
  })
  job.on('close', code => {
    this.ws.send(`reset_testnet_monitor EXIT CODE ${code}`)
  })
}

