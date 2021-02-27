# Simple Nano client for Node and Browser

A simplified client for the Nano network. This library aims to support the most used actions for interacting
with Nano.


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

### Receive

To receive nano, we need **address**, **public key** and **private key** to sign a receive block (_the block is signed
locally_). For testing purposes this can be generated over at [Nano Tools](https://nanoo.tools/key-address-seed-converter) or any similar tool. There's
also a convenient method in the client itself to generate a wallet: `client.generateWallet()`.

To receive Nano, first ensure that there exists pending block for the account (aka. send a small test amount to the address).

```javascript
const account = {
    address: "nano_.....", // Replace with address here
    publicKey: "public-key", // Replace public key
    privateKey: "private-key", // Replace private key
    balance: { raw: '0' }, // Leave this one, balance will be updated
}

// Here we specify to only perform 1 "update". If there are multiple pending transactions, consider increasing this.
const accountAfterReceive = await client.receive(account, 1) 

// should show the new balance
console.log(updatedAccount.balance) 
```

### Send

To send your newly received nano:

```javascript
// We re-use the account created in the previous section
const updatedAccount = await client.send(account, 'nano_3ktybzzy14zxgb6osbhcc155pwk7osbmf5gbh5fo73bsfu9wuiz54t1uozi1', {
    raw: '100000000'
})

// should show the new balance
console.log(updatedAccount.balance) // should show the new balance
```


### Change representative

To change representative for an account:

```javascript
// We re-use the account created in the previous section
account.representative = 'nano_.....'
await client.setRepresentative(account)
```
