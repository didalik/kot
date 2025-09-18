import { fileURLToPath } from 'url' // {{{1
import { dirname } from 'path'
import { spawn } from 'node:child_process'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const DEV_KIT = { // {{{1
  test_signTaking: function (opts) { return test_signTaking.call(this, opts); },
}

export const GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ = { // {{{1
  selftest: function (opts) { return selftest.call(this, opts); },
  setup_selftest: function (opts) { return setup_selftest.call(this, opts); },
}

function selftest () { // {{{1
  let job = spawn(
    `${__dirname}/module-job-hx-definition/selftest/bin/job`,
    [
      '10000',
      '../../../../module-topjob-hx-agent/lib/module-topjob-hx-definition/reset_testnet/build/testnet'
    ],
    { cwd: `${__dirname}/module-job-hx-definition/selftest` }
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

function setup_selftest (opts = { args: [] }) { // {{{1
  let job = spawn(
    `${__dirname}/module-job-hx-definition/setup_selftest/bin/job`,
    [
      '10000',
      '../../../../module-topjob-hx-agent/lib/module-topjob-hx-definition/reset_testnet/build/testnet'
    ],
    { cwd: `${__dirname}/module-job-hx-definition/setup_selftest` }
  )
  job.on('error', err => console.error(`E R R O R  ${err}`))
  job.stderr.on('data', data => console.error('setup_selftest stderr', data.toString()))
  job.stdout.on('data', data => {
    this.ws.send(data)
  })
  job.on('close', code => {
    this.ws.send(`setup_selftest EXIT CODE ${code}`)
    this.ws.close()
  })
}

function test_signTaking () { // {{{1
  this.ws.send('Hello from test_signTaking!')
}

