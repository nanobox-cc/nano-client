import {NANO} from "../models";
import BigNumber from "bignumber.js";
import {tools} from "nanocurrency-web";

export function rawToNANO(raw: string): string {
    return tools.convert(raw, 'RAW', 'NANO')
}

export function NANOToNumber(nano: NANO): number {
    const number = new BigNumber(nano.asString);
    return Number.parseFloat(number.toFixed(number.decimalPlaces()))
}

export function fromNANOString(nano: string): NANO {
    return NANO.fromRAW(tools.convert(nano, 'NANO', 'RAW'))
}

export function addNano(one: NANO, second: NANO): NANO {
    return fromNANOString(new BigNumber(one.asString).plus(new BigNumber(second.asString)).toString())
}
export function subtractNano(one: NANO, second: NANO): NANO {
    return fromNANOString(new BigNumber(one.asString).minus(new BigNumber(second.asString)).toString())
}
