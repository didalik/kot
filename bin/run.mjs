#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import https from 'https';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reqUrl = 'https://jag.kloudoftrust.org';
const mTLS_public_cert_pem = path.resolve(__dirname, '../cloudflare-job-fair/jag/certificate.pem')
const mTLS_private_key_key = path.resolve(__dirname, '../cloudflare-job-fair/jag/certificate.key')

const headers = {
  Accept: 'application/json',
  // add what you need like you would normally
};

async function makeRequest() {
  // you can also pass a ca or a pfx cert and much more! https.Agent uses the same options as tls.createSecureContext:
  // https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
  const options = {
    // when using this code in production, for high throughput you should not read
    //   from the filesystem for every call, it can be quite expensive. Instead
    //   consider storing these in memory
    cert: fs.readFileSync(mTLS_public_cert_pem, `utf-8`,),
    key: fs.readFileSync(mTLS_private_key_key, 'utf-8',),
    //passphrase:
      //'<your-passphrase>',

    // in test, if you're working with self-signed certificates
    //rejectUnauthorized: false,
    // ^ if you intend to use this in production, please implement your own
    //  `checkServerIdentity` function to check that the certificate is actually
    //  issued by the host you're connecting to.
    //
    //  eg implementation here:
    //  https://nodejs.org/api/https.html#https_https_request_url_options_callback

    keepAlive: false, // switch to true if you're making a lot of calls from this client
  };

  // we're creating a new Agent that will now use the certs we have configured
  const sslConfiguredAgent = new https.Agent(options);

  try {
    // make the request just as you would normally ...
    const response = await fetch(reqUrl, {
      headers: headers, // ... pass everything just as you usually would
      agent: sslConfiguredAgent, // ... but add the agent we initialised
    });

    const responseBody = await response.text();

    // handle the response as you would see fit
    console.log(responseBody);
  } catch (error) {
    console.log(error);
  }
}

makeRequest();
