import {NANO} from "../models";

describe('NANO', function () {
    test('toNANO', () => {
        const nano = NANO.fromRAW('10000000000000000000000000000')
        expect(nano.asString).toStrictEqual('0.010000000000000000000000000000')
    })
    test('toNumber', () => {
        const nano = NANO.fromRAW('10000000000000000000000000000')
        expect(nano.asNumber).toStrictEqual(0.01)
    })
    test('fromNumber', () => {
        const nano = NANO.fromNumber(0.000000000000001)
        expect(nano.RAW).toStrictEqual('1000000000000000')
    })
    test('add', () => {
        const one = NANO.fromNumber(100)
        const two = NANO.fromNumber(1010)
        expect(one.add(two).RAW).toStrictEqual(NANO.fromNumber(1110).RAW)
    })
    test('subtract', () => {
        const one = NANO.fromNumber(100)
        const two = NANO.fromNumber(1010)
        expect(two.subtract(one).RAW).toStrictEqual(NANO.fromNumber(910).RAW)
    })
});
