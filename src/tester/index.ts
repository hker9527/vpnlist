import { ZodType } from "zod";
import { debug } from "../Reporting";
import { SiteResult } from "../type/SiteResult";

export abstract class Tester {
    protected async fetch(obj: {
        url: string,
        argv?: string[]
    }): Promise<{
        http_code: string,
        time_connect: number,
        response: string
    } | null> {
        const argv = [
            "curl",
            "-s",
            "-w", "\\n%{http_code} %{time_connect}",
            "-m", "10",
            "-L",
            ...(obj.argv ?? []),
            obj.url
        ];

        const process = Bun.spawnSync(argv);

        switch (process.exitCode) {
            case 0:
                break;
            case 28:
                debug(this.constructor.name, `curl timed out`);
                return null;
            default:
                debug(this.constructor.name, `curl failed with exit code ${process.exitCode}`);
                return null;
        }

        const output = process.stdout.toString().split("\n");
        const writeout = output.pop()!;
        const match = writeout.match(/^(.*) ([0-9.]+)$/)!;

        return {
            http_code: match[1],
            time_connect: parseFloat(match[2]) * 1000 | 0,
            response: output.join("\n")
        };
    }

    protected async fetchJson<T>(obj: {
        url: string,
        schema: ZodType<T>
        argv?: string[]
    }): Promise<{
        http_code: string,
        time_connect: number,
        response: T
    } | null> {
        const result = await this.fetch(obj);
        if (result === null) return null;

        try {
            return {
                ...result,
                response: obj.schema.parse(JSON.parse(result.response))
            };
        } catch (e) {
            debug(this.constructor.name, `Failed to parse JSON: ${e}`);
            return null;
        }
    }
    
    public abstract init(): Promise<boolean>;
    public abstract test(device: string): Promise<SiteResult>;
};