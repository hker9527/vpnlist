import { Tester } from ".";
import { SiteResult } from "../type/SiteResult";

export class UmaGlobalTester extends Tester {
    public async init(): Promise<boolean> {
        return true;
    }
    
    public async test(device: string): Promise<SiteResult> {
        const result = await this.fetch({
            url: "https://api.games.umamusume.com/",
            argv: [
                "--interface", device
            ]
        });

        if (result?.http_code === "404") {
            return {
                site: "umag",
                success: true,
                duration: result.time_connect
            }
        }

        return {
            site: "umag",
            success: false
        };
    }
};