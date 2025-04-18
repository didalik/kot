document.oncut = (event) => {
  let a = event.target.id.split('-')
  let text = prompt(`Delete KV pair for key ${a[1]} in ${a[0]} ${a[2]} [y/n]?`, 'n')
  if (text != 'y') {
    return;
  }
  let href = `${location.origin}${location.pathname}/delete${a[0]}${a[2]}?k=${a[1]}`
  location.href = href
};

let c = document.getElementById('update')
c.textContent = 'This page has been served to IPADDRESS on DATETIME.'

