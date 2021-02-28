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

export function setup(websocketUrl: string): WebSocket {
    const ws: WebSocket = new WebSocket(websocketUrl)

    ws.onopen = function open() {
        console.log('connected');
        ws.send(Date.now());
    }

    ws.onclose = function close() {
        console.log('disconnected');
    }

    ws.onmessage = function incoming(data: any) {
        console.log(`Roundtrip time: ${Date.now() - data} ms`);

        setTimeout(function timeout() {
            ws.send(Date.now());
        }, 500);
    }
    return ws
}
