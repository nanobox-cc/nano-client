import {
    HttpLibrary,
    RequestContext,
    ResponseBody,
    ResponseContext,
    wrapHttpLibrary
} from "@nanobox/nano-rpc-typescript";
import fs from "fs";

/** Mocks out node responses */
export function mockHttpLibrary(): HttpLibrary {
    let files: Record<string, Buffer> = {}
    let ROOT_PATH = './src/__tests__/resources/';
    fs.readdirSync(ROOT_PATH).forEach(filename => {
        files[filename] = fs.readFileSync(`${ROOT_PATH}/${filename}`)
    });

    return wrapHttpLibrary({
        send(request: RequestContext): Promise<ResponseContext> {
            const file = files[`${request.getUrl().replace('https://api.nanobox.cc/#', '')}.json`]
            const body: ResponseBody = {
                text: () => Promise.resolve(file.toString('utf-8')),
                binary: () => Promise.resolve(new Blob([file.toString('utf-8')], {type:'text/plain'}))
            };
            return Promise.resolve(new ResponseContext(200, {
                'content-type': 'application/json'
            }, body));
        }
    })
}
