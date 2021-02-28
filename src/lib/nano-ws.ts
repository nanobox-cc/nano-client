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
    account: NanoAddress
    amount: RAW
    currentBalance: RAW
}

export interface Received {
    account: NanoAddress
    amount: RAW
    currentBalance: RAW
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
                    const balance = confirmation.block.balance ? confirmation.block.balance.toString() : '0'

                    if(confirmation.block.subtype === 'send') {
                        this.listeners[confirmation.account]?.onSent?.({
                            account: confirmation.account,
                            currentBalance: { raw: balance },
                            amount: { raw: confirmation.amount }
                        })
                    } else if(confirmation.block.subtype === 'receive') {
                        this.listeners[confirmation.account]?.onReceived?.({
                            account: confirmation.account,
                            currentBalance: { raw: balance },
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
