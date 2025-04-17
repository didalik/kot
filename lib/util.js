class DataCurator { // {{{1
  constructor (page) {
    this.page = page;
  }
  async ppDOs () { // {{{2
    let text = '';
    for (let e of this.page.data.DOs) {
      text += `<hr/><p><b>${e[0].name}</b>`;
      let list = await e[1].list();
      for (let f of list) {
        text += `<pre>${pp(f)}</pre>`;
      }
      text += '</p>';
    }
    return text;
  }
  ppKVs () { // {{{2
    let text = '';
    for (let e of this.page.data.KVs) {
      text += `<li>${e[0].name}</li>`;
    }
    return text;
  } // }}}2
}

class IpState { // {{{1
  constructor(ip) {
    this.ip= ip;
  }

  static ips = [];
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
}

class Page { // {{{1
  constructor (name, env) {
    this.text = Page.pages[name.slice(1)];
    this.env = env;
    this.data = {};
  }
  set (content) { // {{{2
    for (let key in content) {
      //console.log(key, typeof content[key]);
      this.text = this.text.replaceAll(key, content[key]);
    }
    return this.text;
  }

  static pages = null;
  static use (pages) { // {{{2
    Page.pages = pages;
    return true;
  }
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


export { DataCurator, IpState, Page } // {{{1
