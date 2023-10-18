import type { APIResponse } from "./APIResponse";

export type SiteResults = {
    result: {
        id: number;
        duration: number;
        timestamp: number;
    };
    tester: number;
    server: {
        ip: string;
        country: string;
        speed: number;
    };
}[];

export type SiteAPIResponse = APIResponse<SiteResults>;