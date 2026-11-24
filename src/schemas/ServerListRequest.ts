import { z } from "zod";
import { COUNTRY_CODES } from "../const";
import { SiteListQuerySchema } from "./SiteListQuery";

export const ServerListRequestSchema = z.object({
    sites: SiteListQuerySchema,
    // Older clients can still request up to 100, but receive no more than 20.
    take: z.coerce.number().min(1).max(100).transform((take) => Math.min(take, 20)),
    orderBy: z.enum(["timestamp", "duration", "speed"]).default("timestamp"),
    country: z.enum(COUNTRY_CODES).optional()
});

export type ServerListRequest = z.infer<typeof ServerListRequestSchema>;
