import {block, wallet} from 'nanocurrency-web';
import type {
  BlockHash,
  Frontier,
  NanoAddress,
  PrivateKey,
  NANO,
} from './models';
import type {
  SendBlock,
  SignedBlock,
  ReceiveBlock,
  RepresentativeBlock,
} from 'nanocurrency-web/dist/lib/block-signer';
import {Wallet} from "nanocurrency-web/dist/lib/address-importer";

export function signReceiveBlock(
  address: NanoAddress,
  privateKey: PrivateKey,
  workHash: string,
  frontier: Frontier,
  walletBalance: NANO,
  representative: NanoAddress,
  blockHash: BlockHash,
  amount: NANO
): SignedBlock {
  const data: ReceiveBlock = {
    walletBalanceRaw: walletBalance.RAW,
    toAddress: address,
    transactionHash: blockHash,
    frontier: frontier,
    representativeAddress: representative,
    amountRaw: amount.RAW,
    work: workHash,
  };

  return block.receive(data, privateKey);
}

export function signSendBlock(
  privateKey: PrivateKey,
  walletBalance: NANO,
  fromAddress: NanoAddress,
  toAddress: NanoAddress,
  frontier: string,
  amount: NANO,
  workHash: string,
  representative: NanoAddress
): SignedBlock {
  const data: SendBlock = {
    walletBalanceRaw: walletBalance.RAW,
    fromAddress: fromAddress,
    toAddress: toAddress,
    representativeAddress: representative,
    frontier: frontier,
    amountRaw: amount.RAW,
    work: workHash,
  };

  return block.send(data, privateKey);
}

export function signRepresentativeBlock(
  privateKey: PrivateKey,
  walletBalance: NANO,
  address: NanoAddress,
  representativeAddress: NanoAddress,
  frontier: string,
  workHash: string
): SignedBlock {
  const data: RepresentativeBlock = {
    walletBalanceRaw: walletBalance.RAW,
    address: address,
    representativeAddress: representativeAddress,
    frontier: frontier,
    work: workHash,
  };

  return block.representative(data, privateKey);
}

export function generateLegacyWallet(seed?: string): Wallet {
  return wallet.generateLegacy(seed || "")
}
