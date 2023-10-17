import { SiteResult } from "./SiteResult";

export interface ServerResult {
    server: {
        ip: string;
        country: string;
        lat: string;
        lon: string;
        speed: string;
        config: string;
    },
    asn: {
        id: string;
        name: string;
    },
    results: SiteResult[]
}