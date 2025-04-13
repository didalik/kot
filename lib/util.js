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

export { IpState, Page } // {{{1
