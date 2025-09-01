import { uint8ToBase64, } from './util.mjs' // {{{1

function post_job (args) { // no client certificate required {{{1
  let originJob =
    location.protocol.startsWith('https') ? 'wss://job.kloudoftrust.org/job'
    : 'ws://ko:8787/job' // FIXME use location.host instead of ko:8787
  let url = `${originJob}/${args[1]}/${encodeURIComponent(args[0])}`
  if (args.length > 2) {
    url += '?' + args[2]
  }
  console.log('post_job url', url, 'args', args)
  let { promise, resolve, reject } = Promise.withResolvers()
  wsConnect(url, resolve, reject)
  return promise;
}

function post_job_args (jobname, userKeys, payload64 = null) { // {{{1
  let [sk, pk] = userKeys.split(' ')
  if (jobname == 'hx/signTaking') {
    return [pk, jobname, `sk=${encodeURIComponent(sk)}&payload64=${payload64}`];
  }
  return [pk, jobname];
}

let log = console.log, global = window // {{{1

function wsConnect (url, resolveJob, rejectJob) { // {{{1
  let [sk, pk] = decodeURIComponent(config.userKeys).split(' ')
  let aux = { data: [], sk, pk }
  let websocket = new WebSocket(url)
  let { promise, resolve, reject } = Promise.withResolvers()
  let tag = _ => 'ws post_job'
  websocket.onerror = err => {
    err.message.endsWith('401') || err.message.endsWith('404') ||
      log(`${tag()} error`, err)
    reject(err) // TODO resolve(true) on connection reset
  }
  websocket.onclose = data => {
    log(`${tag()} close`, data)
    resolve(false)
  }
  websocket.onopen = _ => {
    log(`${tag()} open`)
  }
  websocket.onmessage = event => {
    let data = event.data.toString()
    log(`${tag()} message`, data)
    aux.data.push(data)
    wsDispatch(aux, data, websocket, resolveJob, rejectJob)
  }
  promise.then(loop => loop ? wsConnect(url, resolveJob, rejectJob) : 
    log(`${tag()}`, 'DONE')
  ).catch(err => rejectJob(err))
}
function wsDispatch (aux, data, ws, resolveJob, rejectJob) { // {{{1
  let jobname = data.slice(1 + data.lastIndexOf(' '))
  if (data.includes('TAKING JOB')) { // {{{2
    if (data.includes('AM TAKING JOB')) {
      global.jobAgentId = data.slice(0, data.indexOf(' '))
    }
    let payload64 = uint8ToBase64(data)
    log('wsDispatch data', data, 'payload64', payload64, 'aux', aux)
    let sk = aux.sk
/*    
    crypto.subtle.importKey('jwk', JSON.parse(sk), 'Ed25519', true, ['sign']).
      then(sk => {
        return crypto.subtle.sign('Ed25519', sk, new TextEncoder().encode(payload64));
      })
*/
      let pk = aux.pk
      post_job(
        post_job_args('hx/signTaking', `${sk} ${pk}`, payload64)
      )
      .then(sig64 => {
        //let sig64 = uint8ToBase64(new Uint8Array(signature))
        log('wsDispatch payload64', payload64, 'sig64', sig64)

        ws.send(JSON.stringify({ payload64, sig64 }))
      }).catch(err => rejectJob(err))
  } else if (data.includes('START JOB')) { // {{{2
    global.log = log
    startJob[jobname].call({ ws })
  } else if (data.includes('STARTED JOB')) { // {{{2
    aux.browser && spawn('bin/test-browser', [aux.browser])
  } else if (data.includes('EXIT CODE') || data.startsWith('DONE')) { // {{{2
    ws.close()
    resolveJob(aux.data[aux.data.length - 2])
  } // }}}2
}

export { post_job, post_job_args, }
