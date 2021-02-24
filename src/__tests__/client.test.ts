import {NanoClient} from "../client";
import {mockHttpLibrary} from "./utils/http-utils";

describe('client tests', () => {
    test('accountInfo returns representative, balance and frontier', async () => {
        const client = new NanoClient({
            url: "https://api.nanobox.cc",
            // Only set in tests
            httpLibrary: mockHttpLibrary('./src/__tests__/resources/account_info.json')
        })
        const accountInfo = await client.getAccountInfo('nano_3ktybzzy14zxgb6osbhcc155pwk7osbmf5gbh5fo73bsfu9wuiz54t1uozi1')

        expect(accountInfo).toStrictEqual({
            representative: 'nano_3ktybzzy14zxgb6osbhcc155pwk7osbmf5gbh5fo73bsfu9wuiz54t1uozi1',
            balance: { raw: '54933693796927740175384549687297' },
            frontier: 'FC867A8774875190197322000B6509480329AA7BDB32F0B32481D5E50FF8FA9E'
        })
    });
})
