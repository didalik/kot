function post_job (args) { // no client certificate required {{{1
  let originJob =
    location.protocol.startsWith('https') ? 'wss://job.kloudoftrust.org/job'
    : 'ws://ko:8787/job' // FIXME use location.host instead of ko:8787
  let url = `${originJob}/${args[1]}/${encodeURIComponent(args[0])}`
  console.log('post_job url', url, 'args', args)
  wsConnect(url)
}

function post_job_args (jobname, userKeys) { // {{{1
  let [sk, pk] = userKeys.split(' ')
  return [pk, jobname]
}

let log = console.log, global = window
let process = {
  argv: [null, null, 'post_job'], 
  exit: rc => {
    log('process.exit rc', rc)
  },
}
function wsConnect (url) { // {{{1
  let websocket = new WebSocket(url)
  let { promise, resolve, reject } = Promise.withResolvers()
  let tag = _ => {
    return 'ws ' + process.argv[2];
  }
  websocket.onerror = err => {
    err.message.endsWith('401') || err.message.endsWith('404') ||
      log(`${tag()} error`, err)
    reject(err)
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
    if (data == 'DONE') { // FIXME
      process.exit(0)
    }
    wsDispatch(data, websocket)
  }
  promise.then(loop => loop ? wsConnect(url) : log(`${tag()}`, 'DONE')).
    catch(e => {
      console.error(e)
    })
}
function wsDispatch (data, ws) { // {{{1
  let jobname = data.slice(1 + data.lastIndexOf(' '))
  if (data.includes('TAKING JOB')) { // {{{2
    if (data.includes('AM TAKING JOB')) {
      global.jobAgentId = data.slice(0, data.indexOf(' '))
    }
    let payload64 = uint8ToBase64(data)
    let sk = process.argv[2] == 'put_agent' ? process.env.JOBAGENT_SK : process.env.JOBUSER_SK
    crypto.subtle.importKey('jwk', JSON.parse(sk), 'Ed25519', true, ['sign']).
      then(sk => {
        return crypto.subtle.sign('Ed25519', sk, new TextEncoder().encode(payload64));
      }).then(signature => {
        let sig64 = uint8ToBase64(new Uint8Array(signature))
        ws.send(JSON.stringify({ payload64, sig64 }))
      }).catch(e => console.error(e))
  } else if (data.includes('START JOB')) { // {{{2
    global.log = log
    startJob[jobname].call({ ws })
  } else if (data.includes('STARTED JOB')) { // {{{2
    configuration.browser && spawn('bin/test-browser', [configuration.browser])
  } else if (data.includes('EXIT CODE') || data == 'DONE') { // {{{2
    ws.close()
  } // }}}2
}

export { post_job, post_job_args, }
