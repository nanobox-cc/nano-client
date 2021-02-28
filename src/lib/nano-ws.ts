import WebSocket from "isomorphic-ws";

import {NanoAddress} from "../models";

interface WSOptions {
    accounts: NanoAddress[]
}

interface WSSubscribe {
    action: string
    topic: string
    options: WSOptions
}

export default class NanoWebsocket {

    readonly ws: WebSocket

    constructor(websocketUrl: string) {
        this.ws = new WebSocket(websocketUrl)

        this.ws.onopen = () => {
            console.log('connected');
            this.ws.send(Date.now());
        }

        this.ws.onclose = () => {
            console.log('disconnected');
        }

        this.ws.onmessage = (data: any) => {
            console.log(`Roundtrip time: ${Date.now() - data} ms`);

            setTimeout(() => {
                this.ws.send(Date.now());
            }, 500)
        }

    }

}
