import {
    AccountInfo,
    Frontier,
    NanoAccount,
    NanoAddress, NanoTransaction,
    NanoWallet,
    PendingTransaction,
    NANO,
    ResolvedAccount,
    Seed
} from "./models";
import {NanoRPCWrapper} from "./nano-rpc-fetch-wrapper";
import {generateLegacyWallet, signReceiveBlock, signRepresentativeBlock, signSendBlock} from "./nanocurrency-web-utils";
import {SignedBlock} from "nanocurrency-web/dist/lib/block-signer";
import {HttpLibrary} from "@nanobox/nano-rpc-typescript";
import {Wallet} from "nanocurrency-web/dist/lib/address-importer";
import NanoWebsocket, {Received, Sent} from "./lib/nano-ws";

export interface BasicAuth {
    username: string
    password: string
}

export interface NanoClientOptions {
    url: string
    defaultRepresentative?: NanoAddress,
    credentials?: BasicAuth,
    httpLibrary?: HttpLibrary,
    websocketUrl?: string,
}

export class NanoClient {

    private readonly DEFAULT_REPRESENTATIVE = 'nano_1kaiak5dbaaqpenb7nshqgq9tehgb5wy9y9ju9ehunexzmkzmzphk8yw8r7u';
    private readonly SEND_WORK = 'fffffff800000000';
    private readonly RECEIVE_WORK = 'fffffe0000000000';
    private readonly OPEN_FRONTIER = '0000000000000000000000000000000000000000000000000000000000000000'
    private readonly nano: NanoRPCWrapper
    private readonly defaultRepresentative: NanoAddress
    private readonly options: NanoClientOptions

    readonly websocket?: NanoWebsocket

    constructor(options: NanoClientOptions) {
        this.nano = new NanoRPCWrapper(options.url, options.httpLibrary, options.credentials)
        this.defaultRepresentative = options.defaultRepresentative || this.DEFAULT_REPRESENTATIVE
        this.options = options

        this.websocket = options.websocketUrl ? new NanoWebsocket(options.websocketUrl) : undefined
    }

    /** Sends the specified amount of RAW to a Nano address */
    async send(
        fromAccount: NanoAccount,
        toAddress: NanoAddress,
        amount: NANO
    ): Promise<NanoAccount | undefined> {
        try {
            const info: AccountInfo | undefined = await this.nano.accountInfo(fromAccount.address);
            return info ? this.processSend(fromAccount, toAddress, amount, info) : fromAccount
        } catch (error) {
            console.log(error);
        }
    }
    /** Sends all current balance from NanoAccount to NanoAddress */
    async sendMax(
        fromAccount: NanoAccount,
        toAddress: NanoAddress,
    ): Promise<NanoAccount | undefined> {
        try {
            const info: AccountInfo | undefined = await this.nano.accountInfo(fromAccount.address);
            return info ? this.processSend(fromAccount, toAddress, info.balance, info) : fromAccount
        } catch (error) {
            console.log(error);
        }
    }

    private async processSend(fromAccount: NanoAccount, toAddress: NanoAddress, amount: NANO, info: AccountInfo): Promise<NanoAccount> {
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
        await this.nano.process(signed, 'send');
        return this.updateWalletAccount(fromAccount);
    }

    /** Updates account to the latest state, resolves any pending blocks */
    async update(
        account: NanoAccount,
        processMaxPending?: number,
    ): Promise<ResolvedAccount> {
        return this.loadAndResolveAccountData(account, processMaxPending || Number.MAX_SAFE_INTEGER, 0)
    }

    /**
     * Resolves transactions for the NanoAccount
     * @deprecated
     */
    async receive(
        account: NanoAccount,
        maxToResolve?: number,
    ): Promise<ResolvedAccount> {
        console.log(`receive() is deprecated, use update() instead`)
        return this.loadAndResolveAccountData(account, maxToResolve || Number.MAX_SAFE_INTEGER, 0)
    }

    private async loadAndResolveAccountData(
        account: NanoAccount,
        maxToResolve: number,
        depth: number,
    ): Promise<ResolvedAccount> {
        try {
            const info: AccountInfo | undefined = await this.nano.accountInfo(account.address);
            // Set rep from account info, with fallback to cached and default
            account.representative =
                info?.representative || account.representative || this.defaultRepresentative;
            // Use balance received
            account.balance = info?.balance || NANO.ZERO;

            const block: PendingTransaction | undefined = await this.nano.getPending(account.address);
            if (block && depth < maxToResolve) {
                await this.receiveBlock(account, info?.frontier, block);
                return this.loadAndResolveAccountData(account, maxToResolve, depth + 1);
            }
            return {
                account,
                resolvedCount: depth,
            };
        } catch (e) {
            return {
                account,
                resolvedCount: depth,
                error: 'unable-to-fetch',
            };
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
        await this.nano.process(receiveBlock, 'receive');
    }

    /** Returns Account info from the network */
    async updateWalletAccount(account: NanoAccount): Promise<NanoAccount> {
        const info: AccountInfo | undefined = await this.nano.accountInfo(account.address);
        return {
            ...account,
            balance: info?.balance || NANO.ZERO,
            representative: info?.representative || this.defaultRepresentative,
        };
    }

    /** Updates representative */
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
                await this.nano.process(signed, 'change');
            }
        } catch (e) {
            console.log(e);
            return undefined;
        }
    }

    /** Returns send and receive transactions for an account */
    async getTransactions(
        address: NanoAddress,
        count?: number,
    ): Promise<NanoTransaction[]> {
        return this.nano.getHistory(address, count)
    }

    /** Generates a wallet based on a random Nano seed */
    generateWallet(seed?: Seed): NanoWallet {
        const wallet: Wallet = generateLegacyWallet(seed)
        return {
            accounts: wallet.accounts.map(a => {
                return {
                    publicKey: a.publicKey,
                    privateKey: a.privateKey,
                    balance: NANO.ZERO,
                    address: a.address
                }
            }),
            seed: wallet.seed
        }
    }

    /** Listen for sent transactions to a given address */
    onSend(address: NanoAddress, sent: (s: Sent) => void) {
        this.websocket?.onSent(address, sent)
    }
    /** Listens for received transaction on a given address */
    onReceive(address: NanoAddress, receive: (s: Received) => void) {
        this.websocket?.onReceived(address, receive)
    }

    /** Stops listening for WebSocket events */
    close(): void {
        this.websocket?.ws.close()
    }
}

