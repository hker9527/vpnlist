import { z } from "zod";
import { COUNTRY_CODES, SITES } from "../const";

export const ServerListRequestSchema = z.object({
    sites: z.enum(SITES).array().optional(),
    take: z.coerce.number().min(1).max(100),
    orderBy: z.enum(["timestamp", "duration", "speed"]).default("timestamp"),
    country: z.enum(COUNTRY_CODES).optional()
});

export type ServerListRequest = z.infer<typeof ServerListRequestSchema>;