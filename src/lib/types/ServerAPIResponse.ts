import type { APIResponse } from "./APIResponse";

export type ServerResult = {
    ip: string;
    country: string;
    lat: number;
    lon: number;
    speed: number;
    config: string;
};

export type ServerAPIResponse = APIResponse<ServerResult>;