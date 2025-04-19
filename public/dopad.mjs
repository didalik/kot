document.oncut = (event) => {
  let a = event.target.id.split('-')
  let text = prompt(`Delete KV pair for key ${a[2]} in ${a[0]} ${a[1]} [y/n]?`, 'n')
  if (text != 'y') {
    return;
  }
  let href = `${location.origin}${location.pathname}/cut${a[1]}?k=${a[2]}`
  location.href = href
};

let c = document.getElementById('update')
c.textContent = 'This page has been served to IPADDRESS on DATETIME.'

