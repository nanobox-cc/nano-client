import {NanoClient} from "../client";
import {mockHttpLibrary} from "./utils/http-utils";
import {Received, Sent} from "../lib/nano-ws";

const SEND_JSON = `
{
        "topic": "confirmation",
        "time": "1614719030071",
        "message": {
            "account": "nano_3yxiqwmjq33z1gcdwn6t5njmfm8tdapze5p6i58jcuzdyi7g8nt3jzotzjuq",
            "amount": "3000000000000000000000000000",
            "hash": "B778F6EC74F72B14D9F00F9E2E5C527A81F178CC92D2EFAA4770E2D6A413970C",
            "confirmation_type": "active_quorum",
            "block": {
                "type": "state",
                "account": "nano_3yxiqwmjq33z1gcdwn6t5njmfm8tdapze5p6i58jcuzdyi7g8nt3jzotzjuq",
                "previous": "33882B13191633C86E0AE72AFD138C85A30FD6A599E31A09ECD4F2191E14721B",
                "representative": "nano_1jtx5p8141zjtukz4msp1x93st7nh475f74odj8673qqm96xczmtcnanos1o",
                "balance": "40387079928399000000000000000000",
                "link": "0E80C11222336C1C3C0836B064DA515D9EA37AAA5A18A328313DC1FF1B835BD5",
                "link_as_account": "nano_15n1r6b46eue5iy1ifoiemf74qeynfxcnpirnen54hg3zwfr8pyo6kazkxcj",
                "signature": "C4DABBD2ED5125758846E624563AF25CF12375AC14F80FC23E99407FD821F04D4EC99B57C955E7BD789A98CF2FD539BD2A72DA1CC1A6F0559A305FD2C14EAE07",
                "work": "c18ec074b96b939e",
                "subtype": "send"
            }
        }
    }
`

const SEND_WITH_TARGET_AS_LINK = `
{
        "topic": "confirmation",
        "time": "1614840868205",
        "message": {
            "account": "nano_1c4rgmmkibhsdqthfeo76h9qahnytyg8tqgrqx58yp3kuz7t8yqb8m6zt1hz",
            "amount": "3000000000000000000000000000",
            "hash": "FD3619B54D9B2C1D54A5135B9108BC628DA127CC114F5BE1510CD2B47DBEFFA7",
            "confirmation_type": "active_quorum",
            "block": {
                "type": "state",
                "account": "nano_1c4rgmmkibhsdqthfeo76h9qahnytyg8tqgrqx58yp3kuz7t8yqb8m6zt1hz",
                "previous": "644F656F7297DF832316E617FD44457B2E48F7FEDDC6EDFD6BFA0BA4C4143593",
                "representative": "nano_1kaiak5dbaaqpenb7nshqgq9tehgb5wy9y9ju9ehunexzmkzmzphk8yw8r7u",
                "balance": "0",
                "link": "FBB0BF271B843F0394BE509A1D2336CCDA5A2DF60EC480CD156FEBF40AE35341",
                "link_as_account": "nano_3yxiqwmjq33z1gcdwn6t5njmfm8tdapze5p6i58jcuzdyi7g8nt3jzotzjuq",
                "signature": "28B9E47558FC778EB12B976387C41BBD0C9BBFE265105123AC3F760EBCE0699C8ECDBF4A0FEACFCF1635D3CCF4314EB77D4C1EB86990E4197C79592F3F77CD07",
                "work": "83a06964af84b1dd",
                "subtype": "send"
            }
        }
    }
`

const client = new NanoClient({
    url: "https://api.nanobox.cc",
    // Basic auth if not using node directly
    credentials: { username: 'username', password: 'password' },
    // Only set in tests
    httpLibrary: mockHttpLibrary(),
    websocketUrl: "ws://localhost:1234",
})

const sendMessage = (data: string) => client.websocket?.ws.onmessage({
    data: data,
    // @ts-ignore
    target: undefined,
    type: "string"

})

describe('nano-ws', () => {
    test('given send should notify on account', done => {
        client.onSend('nano_3yxiqwmjq33z1gcdwn6t5njmfm8tdapze5p6i58jcuzdyi7g8nt3jzotzjuq', send => {
            expect(send.to).toStrictEqual('nano_15n1r6b46eue5iy1ifoiemf74qeynfxcnpirnen54hg3zwfr8pyo6kazkxcj')
            expect(send.amount.RAW).toStrictEqual('3000000000000000000000000000')
            done()
        })
        sendMessage(SEND_JSON)
    })

    test('given a send block, should register a receive on the link_as_account', done => {
        let gotSend: Sent | undefined = undefined;
        let gotReceive: Received | undefined = undefined;

        const check = () => gotSend && gotReceive ? done() : undefined

        client.onSend('nano_1c4rgmmkibhsdqthfeo76h9qahnytyg8tqgrqx58yp3kuz7t8yqb8m6zt1hz', send => {
            gotSend = send
            check()
        })
        client.onReceive('nano_3yxiqwmjq33z1gcdwn6t5njmfm8tdapze5p6i58jcuzdyi7g8nt3jzotzjuq', receive => {
            gotReceive = receive
            check()
        })

        sendMessage(SEND_WITH_TARGET_AS_LINK)
    })
})

afterAll(() =>{
    try {
        client.close()
    } catch (e) {}
})
