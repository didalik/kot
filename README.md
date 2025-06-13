# Stellar Help Exchange + Cloudflare Job Fair = kloudoftrust.org!

**Stellar Help Exchange** is an equitable cloud-based marketplace where you exchange all kinds of help for HEXA - Help EXchange Asset. If you don't get the help you paid for, you get your HEXA back, and the help provider's reputation suffers. Stellar Help Exchange runs on [Stellar](https://stellar.com/).

**Cloudflare Job Fair** is a place where all types of Job Requests meet all kinds of Job Agents. When an Agent gets authorized to do a Job, the job becomes a Help Exchange item with a certain amount of HEXA assigned to it. And **kloudoftrust.org** runs on [Cloudflare](https://www.cloudflare.com/)!

## Getting Started

Here,I just reflect the steps I make - ymmv, but not much.

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
bin/uh-setup alik ko kot
```
