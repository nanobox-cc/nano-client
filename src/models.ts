import {tools} from "nanocurrency-web";
import {rawToNANO, NANOToNumber, NANOToRaw} from "./lib/conversions";

export type NanoAddress = string;
export type Seed = string;
export type PrivateKey = string;
export type PublicKey = string;
export type Frontier = string;
export type BlockHash = string;

type ApiError = 'unable-to-fetch';

export interface NanoAccount {
  address: NanoAddress;
  publicKey: PublicKey;
  privateKey: PrivateKey;
  balance: NANO;
  representative?: NanoAddress;
}

export interface NanoWallet {
  accounts: NanoAccount[];
  seed: Seed;
}

export interface NanoTransaction {
  account: NanoAddress;
  amount: NANO;
  type: string;
  localTimestamp: string;
}

export class NANO {

  readonly RAW: string
  readonly asString: string
  readonly asNumber: number

  static readonly ZERO: NANO = new NANO('0')
  static readonly fromRAW = (raw: string) => new NANO(raw)
  static readonly fromNumber = (nano: number) => new NANO(NANOToRaw(nano.toString()))

  private constructor(RAW: string) {
    this.RAW = RAW
    this.asString = rawToNANO(RAW)
    this.asNumber = NANOToNumber(this)
  }

  add = (other: NANO) => NANO.fromNumber(this.asNumber + other.asNumber)
  subtract = (other: NANO) => NANO.fromNumber(this.asNumber - other.asNumber)
}

export interface AccountInfo {
  representative: NanoAddress;
  balance: NANO;
  frontier: Frontier;
}

export interface PendingTransaction {
  hash: BlockHash;
  amount: NANO;
}

export interface ResolvedAccount {
  account: NanoAccount;
  resolvedCount: number;
  error?: ApiError;
}
