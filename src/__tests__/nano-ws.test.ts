import {NanoClient} from "../client";
import {mockHttpLibrary} from "./utils/http-utils";

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
            expect(send.amount.raw).toStrictEqual('3000000000000000000000000000')
            done()
        })
        sendMessage(SEND_JSON)
    })
})

afterAll(() =>{
    try {
        client.close()
    } catch (e) {}
})
