import type {AccountInfo, NanoAddress, NanoTransaction, PendingTransaction,} from './models';
import {
  AccountHistoryRequest,
  AccountInfoRequest, BlockState,
  ModelBoolean,
  NodeRPCsApi,
  PendingRequest,
  ProcessRequest,
  ProcessResponse,
  SubType,
  WorkGenerateRequest,
} from '@nanobox/nano-rpc-typescript';
import {BasicAuth} from "./client";

export class NanoRPCWrapper {

  readonly nanoApi: NodeRPCsApi

  constructor(url: string, credentials?: BasicAuth) {
    if(credentials) {
      this.nanoApi = new NodeRPCsApi(credentials.username, credentials.password, url)
    } else {
      this.nanoApi = new NodeRPCsApi(url)
    }
  }

  async process(
      block: any,
      subtype: SubType
  ): Promise<ProcessResponse> {
    const { body } = await this.nanoApi.process({
      action: ProcessRequest.ActionEnum.Process,
      block: block,
      jsonBlock: ModelBoolean.True,
      subtype: subtype
    })

    if (body.hash) {
      return body;
    } else {
      throw Error('unable to process');
    }
  }

  async generateWork(
      frontier: string,
      work: string
  ): Promise<string> {
    const { body } = await this.nanoApi.workGenerate({
      action: WorkGenerateRequest.ActionEnum.WorkGenerate,
      hash: frontier,
      difficulty: work,
    });
    if(body.work) {
      return body.work;
    } else {
      throw new Error('work missing in response')
    }
  }

  async getHistory(
      address: NanoAddress
  ): Promise<NanoTransaction[]> {
    try {

      const { body }  = await this.nanoApi.accountHistory({
        action: AccountHistoryRequest.ActionEnum.AccountHistory,
        account: address,
        count: '10',
      });
      return body.history.map((block) => {
        return {
          account: block.account,
          amount: { raw: block.amount?.toString() },
          type: BlockState[block.type],
          localTimestamp: block.localTimestamp,
        };
      });
    } catch (e) {
      return [];
    }
  }

  async getPending(
      address: NanoAddress
  ): Promise<PendingTransaction | undefined> {
    const { body } = await this.nanoApi.pending({
      action: PendingRequest.ActionEnum.Pending,
      account: address,
      includeOnlyConfirmed: ModelBoolean.True,
      sorting: ModelBoolean.True,
      source: ModelBoolean.True,
    });
    if (body.blocks) {
      const blocks: [hash: string, block: any][] = Object.entries(body.blocks);
      if (blocks.length > 0) {
        const [blockHash, {amount}] = blocks[0];
        return {
          hash: blockHash,
          amount: {
            raw: amount,
          },
        };
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  }

  async accountInfo(
      account: NanoAddress
  ): Promise<AccountInfo | undefined> {
    const { body } = await this.nanoApi.accountInfo({
      action: AccountInfoRequest.ActionEnum.AccountInfo,
      account: account,
      representative: ModelBoolean.True,
    });
    if (
        body.representative === undefined ||
        body.balance === undefined ||
        body.frontier === undefined
    ) {
      return undefined;
    } else {
      return {
        representative: body.representative,
        balance: {
          raw: body.balance.toString(),
        },
        frontier: body.frontier,
      };
    }
  }
}
