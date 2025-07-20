import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { spawn } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function selftest () { // {{{1
  let job = spawn(
    `${__dirname}/module-hx-definition/selftest/bin/job`,
    [amountMA, '../reset_testnet/build/testnet'],
    { cwd: `${__dirname}/module-topjob-hx-definition/selftest` }
  )
  job.on('error', err => console.error(`E R R O R  ${err}`))
  job.stderr.on('data', data => log('selftest stderr', data.toString()))
  job.stdout.on('data', data => {
    this.ws.send(data)
  })
  job.on('close', code => {
    this.ws.send(`selftest EXIT CODE ${code}`)
  })
}

export function setup_selftest () { // {{{1
  let job = spawn(
    `${__dirname}/module-hx-definition/setup_selftest/bin/job`,
    [amountMA, '../reset_testnet/build/testnet'],
    { cwd: `${__dirname}/module-topjob-hx-definition/setup_selftest` }
  )
  job.on('error', err => console.error(`E R R O R  ${err}`))
  job.stderr.on('data', data => log('setup_selftest stderr', data.toString()))
  job.stdout.on('data', data => {
    this.ws.send(data)
  })
  job.on('close', code => {
    this.ws.send(`setup_selftest EXIT CODE ${code}`)
  })
}

