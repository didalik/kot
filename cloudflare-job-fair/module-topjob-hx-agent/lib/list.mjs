import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { spawn } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function reset_testnet (amountHEXA = '10000') { // {{{1
  //log('reset_testnet global', global, '__dirname', __dirname)
  let job = spawn(
    `${__dirname}/module-topjob-hx-definition/reset_testnet/bin/job`,
    [amountHEXA],
    { cwd: `${__dirname}/module-topjob-hx-definition/reset_testnet` }
  )
  job.on('error', err => console.error(`E R R O R  ${err}`))
  job.stdout.on('data', data => {
    //log('reset_testnet data', data.toString())
    this.ws.send(data)
  })
  job.on('close', code => {
    //log('reset_testnet close code', code)
    this.ws.close()
  })
}

export function reset_testnet_monitor () { // {{{1
}

