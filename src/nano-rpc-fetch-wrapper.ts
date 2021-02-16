import type {
  AccountInfo,
  NanoAddress,
  NanoTransaction,
  PendingTransaction,
} from './models';
import {
  AccountHistoryRequestActionEnum,
  AccountHistoryResponse,
  AccountInfoRequestActionEnum,
  AccountInfoResponse,
  Configuration,
  ModelBoolean,
  NodeRPCsApi,
  PendingRequestActionEnum,
  PendingResponse,
  ProcessRequestActionEnum,
  ProcessResponse,
  SubType,
  WorkGenerateRequestActionEnum,
  WorkGenerateResponse,
} from 'nano-rpc-fetch';

export class NanoRPCWrapper {

  readonly nanoApi: NodeRPCsApi

  constructor(url: string) {
    this.nanoApi = new NodeRPCsApi(
        new Configuration({
          basePath: url,
        })
    );
  }

  async process(
      block: any,
      subtype: SubType
  ): Promise<ProcessResponse> {
    const response = await this.nanoApi.process({
      processRequest: {
        action: ProcessRequestActionEnum.Process,
        block: block,
        jsonBlock: ModelBoolean.True,
        subtype: subtype,
      },
    });

    if (response.hash) {
      return response;
    } else {
      throw Error('unable to process');
    }
  }

  async generateWork(
      frontier: string,
      work: string
  ): Promise<string> {
    const response: WorkGenerateResponse = await this.nanoApi.workGenerate({
      workGenerateRequest: {
        action: WorkGenerateRequestActionEnum.WorkGenerate,
        hash: frontier,
        difficulty: work,
      },
    });
    if(response.work) {
      return response.work;
    } else {
      throw new Error('work missing in response')
    }
  }

  async getHistory(
      address: NanoAddress
  ): Promise<NanoTransaction[]> {
    try {
      const history: AccountHistoryResponse = await this.nanoApi.accountHistory({
        accountHistoryRequest: {
          action: AccountHistoryRequestActionEnum.AccountHistory,
          account: address,
          count: '10',
        },
      });
      // @ts-ignore
      return history.history.map((block) => {
        return {
          account: block.account,
          amount: { raw: block.amount?.toString() },
          type: block.type,
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
    const response: PendingResponse = await this.nanoApi.pending({
      pendingRequest: {
        action: PendingRequestActionEnum.Pending,
        account: address,
        includeOnlyConfirmed: ModelBoolean.True,
        sorting: ModelBoolean.True,
        source: ModelBoolean.True,
      },
    });
    if (response.blocks) {
      const blocks: [hash: string, block: any][] = Object.entries(response.blocks);
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
    const response: AccountInfoResponse = await this.nanoApi.accountInfo({
      accountInfoRequest: {
        action: AccountInfoRequestActionEnum.AccountInfo,
        account: account,
        representative: ModelBoolean.True,
      },
    });
    if (
        response.representative === undefined ||
        response.balance === undefined ||
        response.frontier === undefined
    ) {
      return undefined;
    } else {
      return {
        representative: response.representative,
        balance: {
          raw: response.balance.toString(),
        },
        frontier: response.frontier,
      };
    }
  }
}
