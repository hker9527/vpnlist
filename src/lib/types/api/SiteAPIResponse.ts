import { z } from "zod";
import { Zod } from "../zod";
import { createAPIResponseSchema } from "./base";

const siteResultSchema = z.array(
    z.object({
        duration: z.number(),
        timestamp: z.string(),
        testerId: z.number(),
        ip: z.string(),
        country: z.string(),
        speed: z.number(),
    })
);

export const ZSiteResult = new Zod(siteResultSchema);
export const ZSiteAPIResponse = new Zod(createAPIResponseSchema(siteResultSchema));

export type SiteResult = z.infer<typeof siteResultSchema>;