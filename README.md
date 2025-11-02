# Stellar Help Exchange + Cloudflare Job Fair = Proof of Concept

**Stellar Help Exchange (hX)** is an equitable cloud-based marketplace where you exchange all kinds of help for HEXA - my Help EXchange Asset. If you don't get the help you paid for, you get your HEXA back, and the help provider's reputation suffers. Stellar Help Exchange runs on [Stellar](https://stellar.com/).

**Cloudflare Job Fair (jF)** is a place where all types of Job Requests meet all kinds of Job Agents. When an Agent gets authorized to do a Job, the job becomes an **hX** item with a certain amount of HEXA assigned to it. It runs on [Cloudflare](https://www.cloudflare.com/).

These are my hobby projects. Combined, they make it possible for me and you to use the Internet for fun and profit. Presently, **jF** enables global access to the **hX + jF** proof of concept demo from [kloudoftrust.org/hx](https://kloudoftrust.org/hx):

```
+-- Stellar --+         +--- Browser (jF user4hX) ----+        +-- Cloudflare --+
|             |<--------| https://kloudoftrust.org/hx |------->|                |
|      hX     | streams +-----------------------------+ WS w/H |       jF       |
|             |                                                |                |
+-------------+                                                +----------------+
       A                          +----------------+                A
       |<-------------------------| jF user for hX |--------------->|
       \                +-----------------+ -------+                /
        \---------------| jF agent for hX |------------------------/
                streams +-----------------+ WebSockets with Hibernate
```

The **hX + jF** concept is applicable to both the real world and the Internet. Some real-world examples could be open-source (AirBnb | Uber)-like applications (see also: [my **hX** presentation on YouTube](https://www.youtube.com/watch?v=y4TELgx28D4)). The digital world applications look more promising, as delivering both help and jobs over the Internet minimizes logistics. An open-source YouTube-like app, anybody?

The issue I want to address here is basic - I need you to join me in order to make the **hX + jF** more than hobby projects one runs for fun. Can we make them run for profit together? I think yes, if you enjoy coding like I do. With some luck, we'll make a better Internet for you and me!

## The Cogs of the Demo

Having run the demo (or having watched [this recording](https://youtu.be/heVR2FzZNag)), you might have noticed its icon, the rotating cogs: ![foo bar](/public/static/favicon.ico). Those are **hX** and **jF**, working together: **hX** tests the marketplace basic API (make/take offers/requests, break/close deals, dispute broken deals), **jF** provides for the setup and execution - resetting the Stellar testnet, supporting the (not test-related) marketplace internals and simulating test-related marketplace participants. Thus, **hX** depends on **jF**.

But **jF** does not necessarily have to make all its Jobs the **hX** items. In fact, the concept of Job User and Job Agent, connecting with each other over Cloudflare Durable Objects using WebSockets with Hibernate, can be applied to many more other use cases. For example, consider the browser restriction on use of the `SubtleCrypto` interface to secure connections only. While perfectly valid in terms of the overall safety of the net, it surely does not simplify the development process. I use this interface to sign/verify Job Users/Agents - a Job User in the browser must sign their request to proceed. In dev, I delegate the job of signing a request to a local Job Agent. Since the agent runs outside of the browser, it signs the payload using the `SubtleCrypto` interface and returns the result back to the browser.

One final note about the Cogs icon. I found it on the Interner more than 10 years ago. Presently, I have no contact info of its author(s), but am prepared to pay them in HEXA for its use. If you are the author, please contact me!

## Known Limitations

The demo has been successfully tested with Mozilla Firefox Developer Edition 141.0b3 (aarch64): on MacBook Air M1, and on iPhone 14.

<i>Coders, COME TOGETHER!</i>
