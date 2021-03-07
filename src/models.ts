import {rawToNANO, NANOToNumber, fromNANOString, addNano, subtractNano} from "./lib/conversions";

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

  /** The RAW value of this representation. */
  readonly RAW: string
  /** The string value of this representation. */
  readonly asString: string
  /** NANO as number. This representation lose precision on large fractions. */
  readonly asNumber: number

  static readonly ZERO: NANO = new NANO('0')
  static readonly fromRAW = (raw: string) => new NANO(raw)
  static readonly fromNumber = (nano: number) => fromNANOString(nano.toString())

  private constructor(RAW: string) {
    this.RAW = RAW
    this.asString = rawToNANO(RAW)
    this.asNumber = NANOToNumber(this)
  }

  plus = (other: NANO) => addNano(this, other)
  minus = (other: NANO) => subtractNano(this, other)
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
