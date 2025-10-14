import { fileURLToPath } from 'url' // {{{1
import { dirname } from 'path'
import { spawn } from 'node:child_process'
import { Keypair, TransactionBuilder, } from '@stellar/stellar-sdk'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const DEV_KIT = { // {{{1
  test_sign: function (opts) { return test_sign.call(this, opts); },
}

export const HX_KIT = { // {{{1
  get_txid_pos: function (opts) { return get_txid_pos.call(this, opts); },
  issuerSign: function (opts) { return issuerSign.call(this, opts); },
  put_txid_pos: function (opts) { return put_txid_pos.call(this, opts); },
}

export const GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ = { // {{{1
  selftest: function (opts) { return selftest.call(this, opts); },
  setup_selftest: function (opts) { return setup_selftest.call(this, opts); },
}

function get_txid_pos (opts) { // {{{1
  this.ws.send('Hello from get_txid_pos!')
  this.ws.close()
}
function issuerSign (opts) { // {{{1
  console.log('issuerSign opts', opts)
  this.ws.send('issuerSign opts '+JSON.stringify(opts))
  this.ws.close()
}
function put_txid_pos (opts) { // {{{1
  this.ws.send('Hello from put_txid_pos!')
  this.ws.close()
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

function test_sign () { // {{{1
  this.ws.send('Hello from test_sign!')
  this.ws.close()
}

