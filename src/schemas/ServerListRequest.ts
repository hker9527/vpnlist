import { z } from "zod";
import { COUNTRY_CODES, SITES } from "../const";

export const ServerListRequestSchema = z.object({
    sites: z.preprocess((val) => {
        if (val === undefined) {
            return undefined;
        }
        if (Array.isArray(val)) {
            return val;
        }
        return [val];
    }, z.enum(SITES).array()).optional(),
    // Older clients can still request up to 100, but receive no more than 20.
    take: z.coerce.number().min(1).max(100).transform((take) => Math.min(take, 20)),
    orderBy: z.enum(["timestamp", "duration", "speed"]).default("timestamp"),
    country: z.enum(COUNTRY_CODES).optional()
});

export type ServerListRequest = z.infer<typeof ServerListRequestSchema>;
