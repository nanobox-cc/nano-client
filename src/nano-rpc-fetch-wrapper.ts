import type {
  AccountInfo,
  NanoAddress,
  NanoTransaction,
  PendingTransaction,
} from './models';
import {
  AccountHistoryResponse,
  AccountInfoResponse,
  configureAuthMethods,
  createConfiguration,
  NodeRPCsApi,
  PendingResponse,
  ProcessResponse,
  SubType,
  WorkGenerateResponse,
} from 'nano-rpc-fetch';
import {BasicAuth} from "./client";
import {ServerConfiguration} from "nano-rpc-fetch/servers";

export class NanoRPCWrapper {

  readonly nanoApi: NodeRPCsApi

  constructor(url: string, credentials?: BasicAuth) {
    this.nanoApi = new NodeRPCsApi(createConfiguration(
        {
          baseServer: new ServerConfiguration<{  }>(url, {  }),
          authMethods: credentials ? configureAuthMethods(credentials) : undefined
        }
    ));
  }

  async process(
      block: any,
      subtype: SubType
  ): Promise<ProcessResponse> {
    const response = await this.nanoApi.process({
      action: "process",
      block: block,
      jsonBlock: 'true',
      subtype: subtype,
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
      action: "work_generate",
      hash: frontier,
      difficulty: work,
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
        action: "account_history",
        account: address,
        count: '10',
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
      action: "pending",
      account: address,
      includeOnlyConfirmed: "true",
      sorting: "true",
      source: "true",
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
      action: "account_info",
      account: account,
      representative: "true",
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
