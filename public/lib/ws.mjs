function post_job (args) { // no client certificate required {{{1
  let originJob =
    location.protocol.startsWith('https') ? 'wss://job.kloudoftrust.org/job'
    : 'ws://ko:8787/job' // FIXME use location.host instead of ko:8787
  console.log('post_job originJob', originJob, 'args', args)
}

function post_job_args (jobname, userKeys) { // {{{1
  let [sk, pk] = userKeys.split(' ')
  return [pk, jobname]
}

export { post_job, post_job_args, }
