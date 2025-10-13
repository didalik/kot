import { JobFairImpl as impl, } from '../cloudflare-job-fair/src/jf3.js' // {{{1

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
    //console.log('serve url', url)
    let a = url.pathname.split('/')
    a[2] == 'cut' && await this.cut('/' + decodeURIComponent(a[3]), url.searchParams.get('k'))
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
  }

  static attach (ws, attachment) { // {{{2
    return impl.attach.call(this, ws, attachment)
  }

  static dispatch (request, env_OR_ws, ctx_OR_null = null) { // {{{2
    return impl.dispatch.call(this, request, env_OR_ws, ctx_OR_null);
  }

  static wsClose (ws, code, reason, wasClean) { // {{{2
    return impl.wsClose.call(this, ws, code, reason, wasClean);
  }

  static wsDispatch (message, ws) { // {{{2
    return impl.wsDispatch.call(this, message, ws);
  }

  // }}}2
}

class Page { // {{{1
  constructor (name, env) { // {{{2
    this.text = Page.pages[name.slice(1)];
    this.env = env;
    //console.log('new Page this.env', this.env)
    this.data = {};
  }
  set (content, vars = []) { // {{{2
    for (let key in content) {
      this.text = this.text.replaceAll(key, content[key]);
    }
    for (let v of vars) {
      this.text = this.text.replaceAll(v, this.env[v]);
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


export { DOpad, IpState, JobFair, Page, } // {{{1

