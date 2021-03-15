import {NanoClient} from "@nanobox/nano-client";
import qrcode from "qrcode-terminal";

const username = undefined // TODO: Set username
const password = undefined // TODO: set password

if(!username || !password) {
    throw new Error('missing username or password config in index.js')
}

const client = new NanoClient({
    url: 'https://api.nanobox.cc',
    credentials: {
        username: username,
        password: password
    },
    websocketUrl: 'wss://ws.nanobox.cc'
})
const account = client.generateWallet().accounts[0]
console.log(`QR-code for address: ${account.address}`)
qrcode.generate(account.address);
console.log(`Send nano to address: ${account.address}`)

client.onReceive(account.address, async received => {
    console.log(`receives ${received.amount.asNumber} NANO from ${received.from}`)
    const updatedAccount = await client.update(account)
    console.log(`sends ${updatedAccount.account.balance.asNumber} NANO to ${received.from}`)
    await client.sendMax(account, received.from)
})
