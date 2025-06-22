# Stellar Help Exchange + Cloudflare Job Fair = kloudoftrust.org

**Stellar Help Exchange** is an equitable cloud-based marketplace where you exchange all kinds of help for HEXA - Help EXchange Asset. If you don't get the help you paid for, you get your HEXA back, and the help provider's reputation suffers. Stellar Help Exchange runs on [Stellar](https://stellar.com/).

**Cloudflare Job Fair** is a place where all types of Job Requests meet all kinds of Job Agents. When an Agent gets authorized to do a Job, the job becomes a Help Exchange item with a certain amount of HEXA assigned to it. And **kloudoftrust.org** runs on [Cloudflare](https://www.cloudflare.com/) and manages the two.

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
alik@ko:~/project/kot$ bin/dev.mjs post_job 'reset_testnet->reset_testnet_monitor->start_testnet_monitor'
execute post_job
- args [ 'reset_testnet->reset_testnet_monitor->start_testnet_monitor' ]
executed
{
  XA: XO,
}

alik@ko:~/project/kot$ # An agent can take a job request if it can run all the jobs in the request.

alik@ko:~/project/kot$ bin/dev.mjs put_agent '*testnet*' # runs *testnet* jobs
execute put_agent
- args [ '*testnet*' ]
executed
{
  XA: XO,
}
```
