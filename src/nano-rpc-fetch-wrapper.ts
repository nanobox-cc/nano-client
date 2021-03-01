import type {AccountInfo, NanoAddress, NanoTransaction, PendingTransaction, RAW,} from './models';
import {
  createConfiguration,
  NodeRPCsApi,
  ProcessResponse,
  SubType,
  ServerConfiguration,
  HttpLibrary, BlockDataJson
} from '@nanobox/nano-rpc-typescript';
import {BasicAuth} from "./client";
import {crossFetch} from "./lib/cross-fetch";

export class NanoRPCWrapper {

  private readonly REQUIRED_RECEIVE_THRESHOLD = '1000000000000000'

  readonly nanoApi: NodeRPCsApi

  constructor(url: string, httpLibrary?: HttpLibrary, credentials?: BasicAuth) {
    this.nanoApi = new NodeRPCsApi(createConfiguration({
      httpApi: httpLibrary || crossFetch(),
      baseServer: new ServerConfiguration<{  }>(url, {  }),
      authMethods: {
        BasicAuth: credentials
      }
    }))
  }

  async process(
      block: BlockDataJson,
      subtype: SubType
  ): Promise<ProcessResponse> {
    const response = await this.nanoApi.process({
      action: 'process',
      block: block,
      json_block: 'true',
      subtype: subtype
    })

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
    const response = await this.nanoApi.workGenerate({
      action: 'work_generate',
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

      const response = await this.nanoApi.accountHistory({
        action: 'account_history',
        account: address,
        count: '10',
      });
      return response.history.map((block) => {
        return {
          account: block.account,
          amount: { raw: block.amount },
          type: block.type,
          localTimestamp: block.local_timestamp,
        };
      });
    } catch (e) {
      return [];
    }
  }

  async getPending(
      address: NanoAddress,
      threshold?: RAW,
  ): Promise<PendingTransaction | undefined> {
    const response = await this.nanoApi.pending({
      action: 'pending',
      account: address,
      include_only_confirmed: 'true',
      sorting: 'true',
      source: 'true',
      threshold: this.REQUIRED_RECEIVE_THRESHOLD
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
    const response = await this.nanoApi.accountInfo({
      action: 'account_info',
      account: account,
      representative: 'true',
    });
    if (response.representative === undefined) {
      return undefined;
    } else {
      return {
        representative: response.representative,
        balance: {
          raw: response.balance,
        },
        frontier: response.frontier,
      };
    }
  }
}
