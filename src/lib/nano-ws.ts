import WebSocket from "isomorphic-ws";

import {NanoAddress, RAW} from "../models";
import {BlockDataJson} from "@nanobox/nano-rpc-typescript";

type WS_ACTION = 'subscribe' | 'update'
type WS_TOPIC = 'confirmation'

interface WSOptions {
    accounts_add?: NanoAddress[]
    accounts?: NanoAddress[]
}

interface WSMessage {
    action: WS_ACTION
    topic: WS_TOPIC
    options: WSOptions
    id?: string
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

export interface Sent {
    to: NanoAddress
    amount: RAW
}

export interface Received {
    from: NanoAddress
    amount: RAW
}

interface Listener {
    onSent?: (s: Sent) => void
    onReceived?: (s: Received) => void
}

export default class NanoWebsocket {

    private listeners: Record<NanoAddress, Listener> = {}
    readonly ws: WebSocket
    private processed: Record<string, string> = {}

    constructor(websocketUrl: string) {
        this.ws = new WebSocket(websocketUrl)
        this.ws.onerror = (error) => console.log(`Websocket error ${error.message}`)
        this.ws.onopen = () => {}
        this.ws.onclose = () => {}

        this.ws.onmessage = (message) => {
            if(typeof message.data === 'string') {
                const response: WSResponse = JSON.parse(message.data);

                if(response.topic === 'confirmation' && response.message) {
                    if(this.processed[response.message.block.signature]) {
                        return;
                    }
                    const confirmation: ConfirmationMessage = response.message
                    /** Send events are sufficient */
                    if(confirmation.block.subtype === 'send' && confirmation.block.link_as_account) {
                        const receiver = this.listeners[confirmation.block.link_as_account]
                        receiver?.onReceived?.({
                            from: confirmation.account,
                            amount: { raw: confirmation.amount },
                        })

                        const sender = this.listeners[confirmation.account]
                        sender?.onSent?.({
                            to: confirmation.block.link_as_account,
                            amount: { raw: confirmation.amount },
                        })
                    }
                    this.processed[response.message.block.signature] = response.message.block.signature
                }
            } else {
                console.log('unable to parse websocket message')
            }
        }
    }

    onSent(address: NanoAddress, send?: (s: Sent) => void) {
        this.listeners[address] = {
            ...this.listeners[address],
            onSent: send,
        }
        this.updateSubscribe(Object.keys(this.listeners))
    }

    onReceived(address: NanoAddress, receive?: (s: Received) => void) {
        this.listeners[address] = {
            ...this.listeners[address],
            onReceived: receive,
        }
        this.updateSubscribe(Object.keys(this.listeners))
    }

    private updateSubscribe(accounts: NanoAddress[]): void {
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
