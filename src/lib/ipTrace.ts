import { z } from "zod";
import { list as countryNames } from "./types/enums/CountryCode";

const ipSchema = z.string().ip();

export function parseIpTrace(text: string) {
    const address = /^ip=([^\r\n]*)/m.exec(text)?.[1].trim();
    const ip = ipSchema.safeParse(address);
    if (!ip.success) return undefined;

    const countryCode = /^loc=([A-Z]{2})\r?$/m.exec(text)?.[1];
    return {
        ip: ip.data,
        country: countryCode ? countryNames[countryCode] : undefined,
    };
}

type IpTraceResult = ReturnType<typeof parseIpTrace>;

export function compareSplitRoute(
    website: IpTraceResult,
    probe: IpTraceResult,
): "unavailable" | "ipv6" | "same" | "different" {
    if (!website || !probe) return "unavailable";
    if (website.ip.includes(":") || probe.ip.includes(":")) return "ipv6";
    return website.ip === probe.ip ? "same" : "different";
}

export function maskIp(ip: string) {
    if (!ip.includes(":")) return `${ip.split(".").slice(0, 2).join(".")}.x.x`;

    const prefix = ip.split("::", 1)[0].split(":");
    return `${prefix[0] || "0"}:${prefix[1] || "0"}:…`;
}
