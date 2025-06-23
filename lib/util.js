import { JobFairImpl as impl, } from '../cloudflare-job-fair/lib/util.mjs' // {{{1

class DOpad { // {{{1
  constructor (page) {
    this.page = page;
  }
  async cut (name, key) { // {{{2
    let e = this.page.data.DOs.find(e => e[0].name == name)
    //console.log('cut', name, key, e)
    if (name == '/kot_do' && key == 'IPs') {
      return; // to keep the IPs FIXME use auth
    }
    let result = await e[1].delete(key)
    return result;
  }
  async ppDOs () { // {{{2
    let text = '';
    for (let e of this.page.data.DOs) {
      text += `<hr/><p><b>${e[0].name}</b>`;
      let list = await e[1].list();
      for (let f of list) {
        let k = f["0"];
        let t = `select + cut = delete ${k}`
        text += `<pre id='DO-${e[0].name}-${k}' title='${t}'>${pp(f)}</pre>`;
      }
      text += '</p>';
    }
    return text;
  }
  async serve (url) { // {{{2
    let a = url.pathname.split('/')
    a[2] == 'cut' && await this.cut('/' + a[3], url.searchParams.get('k'))
    return await this.ppDOs();
  }
}

class IpState { // {{{1
  constructor(ip) { // {{{2
    this.ip= ip;
  }

  static ips = []; // {{{2

  static add (ip) { // {{{2
    IpState.ips.push(new IpState(ip));
  }
  static get (ip, key) { // {{{2
    return IpState.ips.find(e => e.ip == ip)[key];
  }
  static set (ip, key, value) { // {{{2
    !IpState.ips.find(e => e.ip == ip) && IpState.add(ip);
    IpState.ips.find(e => e.ip == ip)[key] = value;
    return true;
  }
  static use (array) { // {{{2
    IpState.ips = array;
    return true;
  }

  // }}}2
}

class JobFair { // {{{1
  constructor () { // {{{2
    this.impl = impl
  }

  add (request, env, ctx) { // {{{2
    log_method_and_url('JobFair.add', request)
    return this.impl.add(request, env, ctx, pp);
  }

  // }}}2
}

class Page { // {{{1
  constructor (name, env) { // {{{2
    this.text = Page.pages[name.slice(1)];
    this.env = env;
    this.data = {};
  }
  set (content) { // {{{2
    for (let key in content) {
      //console.log('page.set', key, typeof content[key]);
      this.text = this.text.replaceAll(key, content[key]);
    }
    return this.text;
  }

  static pages = null; // {{{2

  static use (pages) { // {{{2
    Page.pages = pages;
    return true;
  }

  // }}}2
}

function log_method_and_url (tag, request, log = true) { // {{{1
  let url = new URL(request.url)
  let method = request.method
  log && console.log(tag, 'request.method', method, 'request.url', url)
  return [method, url];
}

function pp (o) { // {{{1
  let indent = '  ', result = '', x
  let t = o => o?.length && typeof o == 'object' ? 'array' : o ? typeof o : 'NIL'
  x = o => { // {{{2
    for (let p of Object.getOwnPropertyNames(o)) {
      let type = t(o[p])
      switch (type) {
        case 'array':
          result += `${indent}${p}: [\n`; indent += '  '
          for (const e of o[p]) {
            if (t(e) == 'object') {
              result += `${indent}{\n`; indent += '  '
              x(e)
              indent = indent.slice(2); result += `${indent}},\n`
            } else { result += `${indent}${e},\n` }}
          indent = indent.slice(2); result += `${indent}],\n`; break
        case 'object':
          result += `${indent}${p}: {\n`; indent += '  '
          x(o[p])
          indent = indent.slice(2); result += `${indent}},\n`; break
        default:
          result += `${indent}${p}: ${o[p]},\n`
      }}  
  } // }}}2
  x(o)
  return `{\n${result}}\n`;
}


export { DOpad, IpState, JobFair, Page, log_method_and_url, } // {{{1

