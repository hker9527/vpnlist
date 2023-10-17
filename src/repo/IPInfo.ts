import { z } from "zod";
import { error } from "../Reporting";

const ipinfoSchema = z.object({
    ip: z.string(),
    country: z.string(),
    loc: z.string(),
    org: z.string()
});

export const lookup = async (ip: string) => {
    try {
        const response = await fetch(`https://ipinfo.io/${ip}/json?token=${Bun.env.IPINFO_TOKEN!}`)
        const json = await response.json();

        const result = ipinfoSchema.parse(json);

        return result;
    } catch (e) {
        error("ipinfo.lookup", e);
        throw e;
    }
}