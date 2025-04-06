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

export { IpState, } // {{{1
