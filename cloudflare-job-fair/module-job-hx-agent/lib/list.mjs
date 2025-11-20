import { fileURLToPath } from 'url' // {{{1
import { dirname } from 'path'
import { spawn } from 'node:child_process'
import * as fs from "node:fs"
import * as tja from '../../module-topjob-hx-agent/lib/list.mjs'
import { loadKeys, reset, } from '../../../public/lib/sdk.mjs'
import { setup_selftest as s_s, } from '../../../lib/util.mjs'
import { Keypair, Networks, TransactionBuilder, } from '@stellar/stellar-sdk'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const nwdir = `${process.env.PWD}/cloudflare-job-fair/module-topjob-hx-agent/lib/module-topjob-hx-definition/reset_testnet/build/testnet`

export const DEV_KIT = { // {{{1
  delegate: function (opts) { return delegate.call(this, opts); },
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

function delegate (opts) { // {{{1
  let amount = opts.args[3].opts.args[0]
  let log = (...args) => {
    let result = ''
    for (let arg of args) {
      result += (arg + ' ')
    }
    this.ws.send(result.slice(0, -1))
  }
  let s = {}, e = { log }, c = { fs }, d = {} // {{{2
  let vm = { s, e, c, d }
  let rtDir = process.env.PWD + '/cloudflare-job-fair/module-topjob-hx-agent/lib/module-topjob-hx-definition/reset_testnet'
  process.chdir(rtDir)
  try {
    fs.unlinkSync('build/testnet.keys')           // HEX_CREATOR
    fs.unlinkSync('build/testnet/HEX_Agent.keys') // might not exist
  } catch(err) {
    console.error('delegate err', err)
  }
  e.log('delegate process.cwd()', process.cwd())

  reset.call(vm, amount). // {{{2
    then(_ => {
      log('_____________________________________________________'); log('')
      return s_s('10000', nwdir, log);
    }).
    then(_ => this.ws.close()).
    catch(err => {
      console.error(err)
    });
}

function get_txid_pos (opts) { // {{{1
  let txidPos = JSON.parse(fs.readFileSync(`${nwdir}/txidPos`))
  this.ws.send(JSON.stringify(txidPos[opts.args.txid]))
  this.ws.close()
}
function issuerSign (opts = {}) { // TODO use opts.args.tag {{{1
  let nwdir = '/home/alik/project/kot/cloudflare-job-fair/module-topjob-hx-agent/lib/module-topjob-hx-definition/reset_testnet/build/testnet' // FIXME
  let keysIssuer = loadKeys(fs, nwdir + '/HEX_Issuer.keys')
  let keypair = Keypair.fromSecret(keysIssuer[0])
  console.log('issuerSign opts', opts, 'keysIssuer', keysIssuer)
  let t = TransactionBuilder.fromXDR(opts.args.txXDR, Networks.TESTNET) // FIXME
  t.sign(keypair)
  this.ws.send(t.toXDR())
  this.ws.close()
}

function put_txid_pos (opts = {}) { // {{{1
  console.log('put_txid_pos opts', opts)
  let txidPos
  try {
    txidPos = JSON.parse(fs.readFileSync(`${nwdir}/txidPos`))
  } catch(err) {
    txidPos = {}
  }
  txidPos[opts.args.txid] = opts.args.pos
  fs.writeFileSync(`${nwdir}/txidPos`, JSON.stringify(txidPos))
  this.ws.send('put_txid_pos txidPos ' + JSON.stringify(txidPos))
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
  job.stderr.on('data', data => console.log('selftest stderr', data.toString()))
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

