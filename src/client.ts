import {AccountInfo, Frontier, NanoAccount, NanoAddress, PendingTransaction, RAW, ResolvedAccount} from "./models";
import {SubType } from "nano-rpc-fetch";
import { NanoRPCWrapper} from "./nano-rpc-fetch-wrapper";
import {signReceiveBlock, signRepresentativeBlock, signSendBlock} from "./nanocurrency-web-wrapper";
import {SignedBlock} from "nanocurrency-web/dist/lib/block-signer";

export interface NanoClientOptions {
    url: string
    defaultRepresentative: NanoAddress
}

export class NanoClient {

    readonly SEND_WORK = 'fffffff800000000';
    readonly RECEIVE_WORK = 'fffffe0000000000';
    readonly OPEN_FRONTIER = '0000000000000000000000000000000000000000000000000000000000000000'
    readonly nano: NanoRPCWrapper
    readonly options: NanoClientOptions

    constructor(options: NanoClientOptions) {
        this.nano = new NanoRPCWrapper(options.url)
        this.options = options
    }
    /** Pockets pending transactions recursively */
    async loadAndResolveAccountData(
        account: NanoAccount,
        resolvedCount: number = 0
    ): Promise<ResolvedAccount> {
        try {
            const info: AccountInfo | undefined = await this.nano.accountInfo(account.address);
            // Set rep from account info, with fallback to cached and default
            account.representative =
                info?.representative || account.representative || this.options.defaultRepresentative;
            // Use balance received
            account.balance = info?.balance || { raw: '0' };

            const block: PendingTransaction | undefined = await this.nano.getPending(
                account.address
            );
            if (block) {
                await this.receiveBlock(account, info?.frontier, block);
                return this.loadAndResolveAccountData(account, resolvedCount + 1);
            }
            return {
                account,
                resolvedCount: resolvedCount,
            };
        } catch (e) {
            return {
                account,
                resolvedCount: resolvedCount,
                error: 'unable-to-fetch',
            };
        }
    }

    async receiveBlock(
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
            account.representative,
            pending.hash,
            pending.amount
        );
        await this.nano.process(receiveBlock, SubType.Receive);
    }

    async sendNano(
        account: NanoAccount,
        toAddress: NanoAddress,
        amount: RAW
    ): Promise<NanoAccount | undefined> {
        try {
            const info: AccountInfo | undefined = await this.nano.accountInfo(account.address);
            if (info) {
                const workHash: string = await this.nano.generateWork(info.frontier, this.SEND_WORK);
                const signed: SignedBlock = signSendBlock(
                    account.privateKey,
                    info.balance,
                    account.address,
                    toAddress,
                    info.frontier,
                    amount,
                    workHash,
                    info.representative
                );
                await this.nano.process(signed, SubType.Send);
                return this.updateWalletAccount(account);
            } else {
                return account;
            }
        } catch (error) {
            console.log(error);
        }
    }

    async updateWalletAccount(account: NanoAccount): Promise<NanoAccount> {
        const info: AccountInfo | undefined = await this.nano.accountInfo(account.address);
        return {
            ...account,
            balance: info?.balance || { raw: '0' },
            representative: info?.representative || this.options.defaultRepresentative,
        };
    }

    async setRepresentative(account: NanoAccount): Promise<void> {
        try {
            const info: AccountInfo | undefined = await this.nano.accountInfo(account.address);
            if (info) {
                const workHash: string = await this.nano.generateWork(info.frontier, this.SEND_WORK);
                const signed: SignedBlock = signRepresentativeBlock(
                    account.privateKey,
                    account.balance,
                    account.address,
                    account.representative,
                    info.frontier,
                    workHash
                );
                await this.nano.process(signed, SubType.Change);
            }
        } catch (e) {
            console.log(e);
            return undefined;
        }
    }
}
