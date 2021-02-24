import {NanoClient} from "../client";
import {mockHttpLibrary} from "./utils/http-utils";
import {NanoAccount, NanoWallet} from "../models";

const client = new NanoClient({
    url: "https://api.nanobox.cc",
    // Only set in tests
    httpLibrary: mockHttpLibrary()
})

describe('nano client', () => {
    test('receive', async () => {
        const wallet: NanoWallet = client.generateWallet()
        const randomAccount = wallet.accounts[0];
        const accountAfterReceive = await client.receive(randomAccount, 1)

        expect(accountAfterReceive).toStrictEqual({
            account: {
                address: randomAccount.address,
                representative: 'nano_3ktybzzy14zxgb6osbhcc155pwk7osbmf5gbh5fo73bsfu9wuiz54t1uozi1',
                balance: { raw: '54933693796927740175384549687297' },
                privateKey: randomAccount.privateKey,
                publicKey: randomAccount.publicKey,
            },
            resolvedCount: 1
        })
    })

    test('send', async () => {
        const wallet: NanoWallet = client.generateWallet()
        const randomAccount = wallet.accounts[0];

        const updatedAccount = await client.send(randomAccount, 'nano_3ktybzzy14zxgb6osbhcc155pwk7osbmf5gbh5fo73bsfu9wuiz54t1uozi1', {
            raw: '10000'
        })
        expect(updatedAccount).toStrictEqual({
            address: randomAccount.address,
            representative: 'nano_3ktybzzy14zxgb6osbhcc155pwk7osbmf5gbh5fo73bsfu9wuiz54t1uozi1',
            balance: { raw: '54933693796927740175384549687297' },
            privateKey: randomAccount.privateKey,
            publicKey: randomAccount.publicKey,
        })
    })

    test('setRepresentative', async () => {
        const wallet: NanoWallet = client.generateWallet()
        await client.setRepresentative(wallet.accounts[0])
    });
})
