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
    test('plus', () => {
        const one = NANO.fromNumber(100)
        const two = NANO.fromNumber(1010)
        expect(one.plus(two).RAW).toStrictEqual(NANO.fromNumber(1110).RAW)
    })
    test('minus', () => {
        const one = NANO.fromNumber(100)
        const two = NANO.fromNumber(1010)
        expect(two.minus(one).RAW).toStrictEqual(NANO.fromNumber(910).RAW)
    })
    test('small numbers', () => {
        const one = NANO.fromRAW('1')
        const two = NANO.fromRAW('1')
        expect(one.plus(two).asNumber).toStrictEqual(2e-30)
    })
    test('large fractions', () => {
        const added = NANO.fromRAW('1').plus(NANO.fromRAW('100000000000000000000000000000000000'))
        expect(added.asNumber).toStrictEqual(100000) // We lost precision
        expect(added.RAW).toStrictEqual('100000000000000000000000000000000001') // Base value has precision
    })
});
