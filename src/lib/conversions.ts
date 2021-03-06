import {NANO} from "../models";
import BigNumber from "bignumber.js";
import {tools} from "nanocurrency-web";

export function rawToNANO(raw: string): string {
    return tools.convert(raw, 'RAW', 'NANO')
}

export function NANOToRaw(nano: string): string {
    return tools.convert(nano, 'NANO', 'RAW')
}

export function NANOToNumber(nano: NANO): number {
    const number = new BigNumber(nano.asString);
    return Number.parseFloat(number.toFixed(number.decimalPlaces()))
}
