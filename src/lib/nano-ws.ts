import WebSocket from "isomorphic-ws";

import {NanoAddress, RAW} from "../models";
import {BlockDataJson, SubType} from "@nanobox/nano-rpc-typescript";

type WS_ACTION = 'subscribe'
type WS_TOPIC = 'confirmation'

interface WSOptions {
    accounts: NanoAddress[]
}

interface WSMessage {
    action: WS_ACTION
    topic: WS_TOPIC
    options: WSOptions
}

interface WSResponse {
    topic: WS_TOPIC
    message: ConfirmationMessage
}
interface ConfirmationMessage extends WSResponse {
    account: NanoAddress
    amount: string
    hash: string
    block: BlockDataJson
}

interface Transaction {
    account: NanoAddress
    amount: RAW
    currentBalance: RAW
}

export interface Send extends Transaction {
    to: NanoAddress
}

export interface Receive extends Transaction {
    from: NanoAddress
}

export default class NanoWebsocket {

    private readonly ws: WebSocket

    private onSend?: (send: Send) => void
    private onReceive?: (receive: Receive) => void

    constructor(websocketUrl: string) {
        this.ws = new WebSocket(websocketUrl)
        this.ws.onerror = (error) => console.log(`Websocket error ${error}`)
        this.ws.onopen = () => {}
        this.ws.onclose = () => {}

        this.ws.onmessage = (data) => {
            if(typeof data.data === 'string') {
                const response: WSResponse = JSON.parse(data.data);
                if(response.topic === 'confirmation' && response.message) {
                    const confirmation: ConfirmationMessage = response.message
                    const balance = confirmation.block.balance ? confirmation.block.balance.toString() : '0'
                    // @ts-ignore
                    if(confirmation.block.subtype === 'send') {
                        this.onSend?.({
                            account: confirmation.account,
                            // @ts-ignore
                            to: confirmation.block.link_as_account,
                            currentBalance: { raw: balance },
                            amount: { raw: confirmation.amount }
                        })
                    }
                    // @ts-ignore
                    else if(confirmation.block.subtype === 'receive') {
                        this.onReceive?.({
                            account: confirmation.account,
                            // @ts-ignore
                            from: confirmation.block.link_as_account,
                            currentBalance: { raw: balance },
                            amount: { raw: confirmation.amount }
                        })
                    }
                }
            } else {
                console.log('unable to parse websocket message')
            }
        }
    }

    onTransaction(accounts: NanoAddress[], onSend?: (send: Send) => void, onReceive?: (receive: Receive) => void): void {
        this.onSend = onSend
        this.onReceive = onReceive

        const message: WSMessage = {
            action: 'subscribe',
            topic: 'confirmation',
            options: {
                accounts: accounts
            }
        }
        if(this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        } else {
            this.ws.onopen = () => this.ws.send(JSON.stringify(message))
        }
    }

}
