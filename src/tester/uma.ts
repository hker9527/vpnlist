import { Tester } from ".";
import { SiteResult } from "../type/SiteResult";

export class UmaTester extends Tester {
    public async init(): Promise<boolean> {
        return true;
    }
    
    public async test(device: string): Promise<SiteResult> {
        const result = await this.fetch({
            url: "https://api-umamusume.cygames.jp/",
            argv: [
                "--interface", device
            ]
        });

        if (result?.http_code === "404") {
            return {
                site: "uma",
                success: true,
                duration: result.time_connect
            }
        }

        return {
            site: "uma",
            success: false
        };
    }
};