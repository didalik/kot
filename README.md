# Stellar Help Exchange + Cloudflare Job Fair = Proof of Concept

**Stellar Help Exchange (hX)** is an equitable cloud-based marketplace where you exchange all kinds of help for HEXA - my Help EXchange Asset. If you don't get the help you paid for, you get your HEXA back, and the help provider's reputation suffers. Stellar Help Exchange runs on [Stellar](https://stellar.com/).

**Cloudflare Job Fair (jF)** is a place where all types of Job Requests meet all kinds of Job Agents. When an Agent gets authorized to do a Job, the job becomes an **hX** item with a certain amount of HEXA assigned to it. It runs on [Cloudflare](https://www.cloudflare.com/).

These are my hobby projects. Combined, they make it possible for me and you to use the Internet for fun and profit. Presently, **jF** enables global access to the **hX + jF** proof of concept demo from [kloudoftrust.org](https://kloudoftrust.org):

```
+-- Stellar --+         +-- Browser (jF user4hX) --+        +-- Cloudflare --+
|             |<--------| https://kloudoftrust.org |------->|                |
|      hX     | streams +--------------------------+ WS w/H |       jF       |
|             |                                             |                |
+-------------+                                             +----------------+
       A                          +----------------+                A
       |<-------------------------| jF user for hX |--------------->|
       \                +-----------------+ -------+                /
        \---------------| jF agent for hX |------------------------/
                streams +-----------------+ WebSockets with Hibernate
```

The **hX + jF** concept is applicable to both the real world and the Internet. Some real-world examples could be open-source (AirBnb | Uber)-like applications. The digital world applications look more promising, as delivering both help and jobs over the Internet minimizes logistics. An open-source YouTube-like app, anybody?

The issue I want to address here is basic - I need you to join me in order to make the **hX + jF** more than hobby projects one runs for fun. Can we make them run for profit together? I think yes, if you enjoy coding like I do. With some luck, we'll make a better Internet for you and me!

## The Cogs of the Demo

Having run the demo, you might have noticed its icon, the rotating cogs: ![foo bar](/public/static/favicon.ico). Those are **hX** and **jF**, working together: **hX** tests the marketplace basic API (make/take offers/requests, break/close deals, dispute broken deals), **jF** provides for the setup and execution - resetting the Stellar testnet, supporting the (not test-related) marketplace internals and simulating test-related marketplace participants.

<i>Coders, COME TOGETHER!</i>
