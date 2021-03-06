[![npm version](https://badge.fury.io/js/%40nanobox%2Fnano-client.svg)](https://badge.fury.io/js/%40nanobox%2Fnano-client)
![build](https://github.com/nanobox-cc/nano-client/actions/workflows/build.yml/badge.svg)

# Simple Nano client for node.js and browser

A simplified client for the [Nano cryptocurrency](https://nano.org/). This library aims to support the most general use-cases for
interacting with the nano network. This be to update an account, list transactions and to send funds.

You can also check out [Nano Ping](https://github.com/nanobox-cc/nano-client/tree/master/examples/nano-ping) over at examples for a
sample implementation with this library.

## Install

Add with yarn or npm:

    $ yarn add @nanobox/nano-client

## Usage

To create the client:

```javascript
import { NanoClient } from "@nanobox/nano-client";

const client = new NanoClient({
    url: "https://api.nanobox.cc", // Or any other node url
    // Basic auth if the Node or proxy requires this
    // credentials: { username: 'username', password: 'password' }
})
```

### Receive nano funds

To receive nano, we need an **address**, **public key** and **private key** to sign a receive block (_the block is signed
locally_). For testing purposes this can be generated over at [Nano Tools](https://nanoo.tools/key-address-seed-converter) or any similar tool. There's
also a convenient method in the client itself to generate a wallet: `client.generateWallet()`. A wallet will be used to derive new accounts.

To receive Nano, first ensure that there exists a pending block for the account by sending a small amount of Nano to the address.

```javascript
const account = {
    address: "nano_.....", // Replace with YOUR address here
    publicKey: "public-key", // Replace with YOUR public key
    privateKey: "private-key", // Replace with YOUR private key
    balance: NANO.ZERO // Balance will be updated on receive/send
}

// Updates account to latest state, this will automatically process receive blocks
const accountAfterReceive = await client.update(account)
```

#### Limit number of receives processed

It's possible to specify number of receives to process by the client. Typically, to avoid loading for too long. 

```javascript
const accountAfterReceive = await client.update(account, 1)
```

### Sending

To send your newly received nano:

```javascript
// We re-use the account created in the previous section
const accountAfterSend = await client.send(account, 'nano_3ktybzzy14zxgb6osbhcc155pwk7osbmf5gbh5fo73bsfu9wuiz54t1uozi1', NANO.fromNumber(0.001))
// accountAfterSend now has balance subtracted sent amount
```

#### Send max

There's a utility function to send all funds from an account to an address:

```javascript
const accountAfterSend = await client.sendMax(account)
// accountAfterSend now has balance: 0
```


### Change representative

To change representative for an account:

```javascript
// We re-use the account created in the previous section
account.representative = 'nano_.....'
await client.setRepresentative(account)
```

### Websockets

There is preliminary websockets support, namely for listening on send and receive events for a given (or multiple)
accounts:

#### Setup

To be able to use websockets, create the client with a websockets url:

```javascript
const client = new NanoClient({
    // ... other options
    websocketUrl: 'wss://ws.nanobox.cc'
})
```

#### To listen for receive events (address that received nano)

```javascript
client.onReceive('nano_34prihdxwz3u4ps8qjnn14p7ujyewkoxkwyxm3u665it8rg5rdqw84qrypzk', received => {
    // Prints receive information
    console.log(s)
})
```

#### To listen for send events (address that sent nano)

```javascript
client.onSend('nano_34prihdxwz3u4ps8qjnn14p7ujyewkoxkwyxm3u665it8rg5rdqw84qrypzk', sent => {
    // Prints sent information
    console.log(s)
})
```
