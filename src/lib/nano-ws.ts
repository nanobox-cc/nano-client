import WebSocket from "isomorphic-ws";

import {NanoAddress, RAW} from "../models";
import {BlockDataJson} from "@nanobox/nano-rpc-typescript";

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
    private readonly ws: WebSocket

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
                    if(confirmation.block.subtype === 'send' && confirmation.block.link_as_account) {
                        this.listeners[confirmation.account]?.onSent?.({
                            to: confirmation.block.link_as_account,
                            amount: { raw: confirmation.amount },
                        })
                        this.listeners[confirmation.block.link_as_account]?.onReceived?.({
                            from: confirmation.account,
                            amount: { raw: confirmation.amount },
                        })
                    } else if(confirmation.block.subtype === 'receive' && confirmation.block.link_as_account) {
                        this.listeners[confirmation.block.link_as_account]?.onReceived?.({
                            from: confirmation.account,
                            amount: { raw: confirmation.amount },
                        })
                        this.listeners[confirmation.account]?.onSent?.({
                            to: confirmation.block.link_as_account,
                            amount: { raw: confirmation.amount },
                        })
                    }
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
