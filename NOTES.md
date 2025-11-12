
## Getting Started

Here, I just reflect the steps I make - ymmv, but not much.

On my Macbook Air M1 (RAM 8Gb, SSD 256Gb) with UTM, I create QEMU 7.2 Virtual Machine:

- Name: `ko`,
- Size: 192Gb,
- Network Mode: Bridged (Advanced),
- QEMU: Use local time for base clock,
- Image: ubuntu-24.04.2-live-server-arm64.iso

and add the following line to my `/etc/hosts` (your IP and username will differ):

```
192.168.0.193   ko      # alik
```

Having SSHed to alik@ko, I run there

```
echo 'alik ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/alik
exit
```

and complete the setup with

```
chmod +x bin/uh-setup
bin/uh-setup alik ko kot
```

And here's a `wrangler login` example:

```
alik@ko:~/project/kot$ npx wrangler login

 ⛅️ wrangler 4.20.0
───────────────────
Attempting to login via OAuth...
Opening a link in your default browser: https://dash.cloudflare.com/oauth2/auth?response_type=code&client_id=54d11594-84e4-41aa-b438-e81b8fa78ee7&redirect_uri=http%3A%2F%2Flocalhost%3A8976%2Foauth%2Fcallback&scope=account%3Aread%20user%3Aread%20workers%3Awrite%20workers_kv%3Awrite%20workers_routes%3Awrite%20workers_scripts%3Awrite%20workers_tail%3Aread%20d1%3Awrite%20pages%3Awrite%20zone%3Aread%20ssl_certs%3Awrite%20ai%3Awrite%20queues%3Awrite%20pipelines%3Awrite%20secrets_store%3Awrite%20offline_access&state=YVyQSn0r~oTHZP3zR73nv5B9~JpkcDXX&code_challenge=DyWBqqmzh6fkNKYsguZcFT3nTw49yuroMoUThK2RCSg&code_challenge_method=S256
▲ [WARNING] Failed to open

# Copy and paste the URL from above to the host's browser.   #
# Click 'Allow'.                                             #
# Copy and paste the URL from the browser to another window. #
# Run curl in the other window.                              #

Successfully logged in.
alik@ko:~/project/kot$ 

### In another window: ###

alik@ko:~$ curl 'http://localhost:8976/oauth/callback?code=CAjrwRz_qi30ceDOLTAqTwuQaQwWrTUFW6f-mCxJDno.XdTjngi89l63S8z50FnKn0Ct0jjia1IkmqUKRg2aACU&scope=account%3Aread%20user%3Aread%20workers%3Awrite%20workers_kv%3Awrite%20workers_routes%3Awrite%20workers_scripts%3Awrite%20workers_tail%3Aread%20d1%3Awrite%20pages%3Awrite%20zone%3Aread%20ssl_certs%3Awrite%20ai%3Awrite%20queues%3Awrite%20pipelines%3Awrite%20secrets_store%3Awrite%20offline_access&state=YVyQSn0r~oTHZP3zR73nv5B9~JpkcDXX'
alik@ko:~$ 
```

## Take 1

```
bin/run.mjs put_agent '*testnet*' # runs *testnet* jobs
bin/run.mjs post_jcl 'hx/reset_testnet'
bin/run.mjs post_jcl 'hx/reset_testnet_monitor'
bin/run.mjs post_job 'hx/selftest' browser=true
bin/run.mjs put_agent '*selftest'
bin/run.mjs post_job 'hx/setup_selftest'
```

See also `bin/{dev,run}.mjs hack do0`

Here is the dir structure for submodules:

```
alik@ko:~/project/kot/cloudflare-job-fair$ tree
.
├── jag
│   ├── certificate
│   └── NOTES.md
├── jcl
│   └── src
│       ├── module-topjob-declaration -> /home/alik/project/kot/cloudflare-job-fair/module-topjob-agent/src/module-topjob-declaration
│       └── module-topjob-hx-declaration -> /home/alik/project/kot/cloudflare-job-fair/module-topjob-hx-agent/src/module-topjob-hx-declaration
├── job
│   └── src
│       ├── module-job-declaration -> /home/alik/project/kot/cloudflare-job-fair/module-job-agent/src/module-job-declaration
│       └── module-job-hx-declaration -> /home/alik/project/kot/cloudflare-job-fair/module-job-hx-agent/src/module-job-hx-declaration
├── lib
│   └── util.mjs
├── module-job-agent
│   ├── lib
│   │   └── module-job-definition
│   │       └── README.md
│   └── src
│       └── module-job-declaration
│           └── README.md
├── module-job-hx-agent
│   ├── lib
│   │   └── module-job-hx-definition
│   │       └── README.md
│   └── src
│       └── module-job-hx-declaration
│           └── README.md
├── module-topjob-agent
│   ├── lib
│   │   └── module-topjob-definition
│   │       └── README.md
│   └── src
│       └── module-topjob-declaration
│           └── README.md
├── module-topjob-hx-agent
│   ├── lib
│   │   └── module-topjob-hx-definition
│   │       └── README.md
│   └── src
│       └── module-topjob-hx-declaration
│           └── README.md
└── src
    └── util.js

32 directories, 12 files
alik@ko:~/project/kot/cloudflare-job-fair$ 
```

## QA on w10 and pi4

```
npm i
npm uninstall wrangler
npm install ws
```
```
alik@DESKTOP-4JIOE6A:~$ tree .cloudflare-job-fair/
.cloudflare-job-fair/
├── CREATOR.keys
└── jag
    ├── certificate.key
    └── certificate.pem

1 directory, 3 files
alik@DESKTOP-4JIOE6A:~$ 
```
```
rm run.log 
make clean
while true;do echo "started on $(date)" >> run.log;PHASE=qa make useTM >> run.log;echo "- exit code $?" >> run.log;sleep 2;done &
```

