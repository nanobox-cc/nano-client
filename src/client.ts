import {
    AccountInfo,
    Frontier,
    NanoAccount,
    NanoAddress,
    NanoWallet,
    PendingTransaction,
    RAW,
    ResolvedAccount
} from "./models";
import {NanoRPCWrapper} from "./nano-rpc-fetch-wrapper";
import {generateLegacyWallet, signReceiveBlock, signRepresentativeBlock, signSendBlock} from "./nanocurrency-web-utils";
import {SignedBlock} from "nanocurrency-web/dist/lib/block-signer";
import {HttpLibrary} from "@nanobox/nano-rpc-typescript";
import {Wallet} from "nanocurrency-web/dist/lib/address-importer";

const DEFAULT_REPRESENTATIVE = 'nano_1kaiak5dbaaqpenb7nshqgq9tehgb5wy9y9ju9ehunexzmkzmzphk8yw8r7u';

export interface BasicAuth {
    username: string
    password: string
}

export interface NanoClientOptions {
    url: string
    defaultRepresentative?: NanoAddress,
    credentials?: BasicAuth,
    httpLibrary?: HttpLibrary
}

export class NanoClient {

    readonly SEND_WORK = 'fffffff800000000';
    readonly RECEIVE_WORK = 'fffffe0000000000';
    readonly OPEN_FRONTIER = '0000000000000000000000000000000000000000000000000000000000000000'
    readonly nano: NanoRPCWrapper
    readonly options: NanoClientOptions
    readonly defaultRepresentative: NanoAddress

    constructor(options: NanoClientOptions) {
        this.nano = new NanoRPCWrapper(options.url, options.httpLibrary, options.credentials)
        this.defaultRepresentative = options.defaultRepresentative || DEFAULT_REPRESENTATIVE
        this.options = options
    }

    /** Sends the specified amount of RAW to a Nano address */
    async send(
        fromAccount: NanoAccount,
        toAddress: NanoAddress,
        amount: RAW
    ): Promise<NanoAccount | undefined> {
        try {
            const info: AccountInfo | undefined = await this.nano.accountInfo(fromAccount.address);
            if (info) {
                const workHash: string = await this.nano.generateWork(info.frontier, this.SEND_WORK);
                const signed: SignedBlock = signSendBlock(
                    fromAccount.privateKey,
                    info.balance,
                    fromAccount.address,
                    toAddress,
                    info.frontier,
                    amount,
                    workHash,
                    info.representative
                );
                await this.nano.process(signed, "send");
                return this.updateWalletAccount(fromAccount);
            } else {
                return fromAccount;
            }
        } catch (error) {
            console.log(error);
        }
    }

    /** Resolves transactions for the Nano account */
    async receive(
        account: NanoAccount,
        maxToResolve?: number
    ): Promise<ResolvedAccount> {
        return this.loadAndResolveAccountData(account, maxToResolve || 1, 0)
    }

    private async loadAndResolveAccountData(
        account: NanoAccount,
        maxToResolve: number,
        depth: number = 0
    ): Promise<ResolvedAccount> {
        if(depth >= maxToResolve) {
            return {
                account,
                resolvedCount: depth,
            };
        } else {
            try {
                const info: AccountInfo | undefined = await this.nano.accountInfo(account.address);
                // Set rep from account info, with fallback to cached and default
                account.representative =
                    info?.representative || account.representative || this.defaultRepresentative;
                // Use balance received
                account.balance = info?.balance || { raw: '0' };

                const block: PendingTransaction | undefined = await this.nano.getPending(
                    account.address
                );
                if (block) {
                    await this.receiveBlock(account, info?.frontier, block);
                    return this.loadAndResolveAccountData(account, maxToResolve, depth + 1);
                }
                return {
                    account,
                    resolvedCount: depth,
                };
            } catch (e) {
                console.log(e)
                return {
                    account,
                    resolvedCount: depth,
                    error: 'unable-to-fetch',
                };
            }
        }
    }

    private async receiveBlock(
        account: NanoAccount,
        frontier: Frontier | undefined,
        pending: PendingTransaction
    ): Promise<void> {
        const work = await this.nano.generateWork(frontier || account.publicKey, this.RECEIVE_WORK);
        const receiveBlock = signReceiveBlock(
            account.address,
            account.privateKey,
            work,
            frontier || this.OPEN_FRONTIER,
            account.balance,
            account.representative || this.defaultRepresentative,
            pending.hash,
            pending.amount
        );
        await this.nano.process(receiveBlock, "receive");
    }

    async updateWalletAccount(account: NanoAccount): Promise<NanoAccount> {
        const info: AccountInfo | undefined = await this.nano.accountInfo(account.address);
        return {
            ...account,
            balance: info?.balance || { raw: '0' },
            representative: info?.representative || this.defaultRepresentative,
        };
    }

    /** Sets representative to the one configured on the model */
    async setRepresentative(account: NanoAccount): Promise<void> {
        try {
            const info: AccountInfo | undefined = await this.nano.accountInfo(account.address);
            if (info) {
                const workHash: string = await this.nano.generateWork(info.frontier, this.SEND_WORK);
                const signed: SignedBlock = signRepresentativeBlock(
                    account.privateKey,
                    account.balance,
                    account.address,
                    account.representative || this.defaultRepresentative,
                    info.frontier,
                    workHash
                );
                await this.nano.process(signed, "change");
            }
        } catch (e) {
            console.log(e);
            return undefined;
        }
    }

    generateWallet(): NanoWallet {
        const wallet: Wallet = generateLegacyWallet()
        return {
            accounts: wallet.accounts.map(a => {
                return {
                    publicKey: a.publicKey,
                    privateKey: a.privateKey,
                    balance: { raw: '0' },
                    address: a.address
                }
            }),
            seed: wallet.seed
        }
    }
}
