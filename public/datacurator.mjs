document.oncut = (event) => {
  console.log(event);
};

let c = document.getElementById('update')
c.textContent = 'This page has been served to IPADDRESS on DATETIME.'

