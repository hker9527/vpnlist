import { ASN, Server } from "@prisma/client";
import { SiteResult } from "./SiteResult";

export interface ServerResult {
    server: Omit<Server, "port" | "proto" | "caId" | "certId" | "keyId" | "asnId">,
    config: {
        port: number,
        proto: string,
        ca: string,
        cert: string,
        key: string
    },
    asn: ASN,
    results: SiteResult[]
}