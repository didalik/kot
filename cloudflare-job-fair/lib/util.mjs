const JobFairImpl = { // EDGE {{{1
  add: () => new Response('OK'),
}

function jagURLparameters (args) { // CLIENT {{{1
  return '?json={"XA":"XO"}';
}

function jobURLparameters (args) { // CLIENT {{{1
  return '?json={"XA":"XO"}';
}

export { JobFairImpl, jagURLparameters, jobURLparameters, } // {{{1

