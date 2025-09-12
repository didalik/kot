import { fileURLToPath } from 'url' // {{{1
import { dirname } from 'path'
import { spawn } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function reset_testnet (opts = { args: ['10000'] }) { // TODO drop default value? {{{1
  let amountHEXA = opts.args[0].toString()
  //log('reset_testnet global', global, '__dirname', __dirname)
  let job = spawn(
    `${__dirname}/module-topjob-hx-definition/reset_testnet/bin/job`,
    [amountHEXA],
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

export function reset_testnet_monitor (amountMA = '10000') { // TODO drop default value {{{1
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

