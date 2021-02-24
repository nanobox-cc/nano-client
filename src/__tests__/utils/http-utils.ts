import {
    HttpLibrary,
    RequestContext,
    ResponseBody,
    ResponseContext,
    wrapHttpLibrary
} from "../../../../nanobox-nano-rpc-typescript";
import fs from "fs";

/** Mocks out node responses */
export function mockHttpLibrary(file: string): HttpLibrary {
    const response = fs.readFileSync(file)
    return wrapHttpLibrary({
        send(request: RequestContext): Promise<ResponseContext> {
            const body: ResponseBody = {
                text: () => Promise.resolve(response.toString('utf-8')),
                binary: () => Promise.resolve(new Blob([response.toString('utf-8')], {type:'text/plain'}))
            };
            return Promise.resolve(new ResponseContext(200, {
                'content-type': 'application/json'
            }, body));
        }
    })
}
