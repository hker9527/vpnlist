import { z } from "zod";
import { VARIANTS } from "../const";
import { SiteListQuerySchema } from "./SiteListQuery";

export const ServerProfileRequestSchema = z.object({
    ip: z.ipv4(),
    variant: z.enum(VARIANTS),
    split: z.stringbool("true").optional(),
    blockIpv6: z.stringbool().optional(),
    sites: SiteListQuerySchema
});

export type ServerProfileRequest = z.infer<typeof ServerProfileRequestSchema>;
