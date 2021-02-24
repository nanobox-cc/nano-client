import {PromiseHttpLibrary, RequestContext, ResponseContext} from "@nanobox/nano-rpc-typescript";
import fetch from 'cross-fetch';

import btoa from 'base-64'

/** For node basic auth support */
global.btoa = btoa.encode

/** Supports fetch on both node.js and browser */
export function crossFetch(): PromiseHttpLibrary {
    return {
        send(request: RequestContext): Promise<ResponseContext> {
            let method = request.getHttpMethod().toString();
            let body = request.getBody();

            return fetch(request.getUrl(), {
                method: method,
                body: body as any,
                headers: request.getHeaders(),
                credentials: "same-origin"
            }).then((resp: any) => {
                const headers: { [name: string]: string } = {};
                resp.headers.forEach((value: string, name: string) => {
                    headers[name] = value;
                });

                const body = {
                    text: () => resp.text(),
                    binary: () => resp.blob()
                };
                return new ResponseContext(resp.status, headers, body);
            })
        }
    }
}
