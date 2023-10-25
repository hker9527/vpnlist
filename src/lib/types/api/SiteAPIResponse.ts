import { z } from "zod";
import { Zod } from "../zod";
import { createAPIResponseSchema } from "./base";

const siteResultSchema = z.object({
    data: z.array(
        z.object({
            result: z.object({
                id: z.number(),
                duration: z.number(),
                timestamp: z.number(),
            }),
            tester: z.number(),
            server: z.object({
                ip: z.string(),
                country: z.string(),
                speed: z.number(),
            }),
        })
    ),
    updatedAt: z.number()
});

export const ZSiteResult = new Zod(siteResultSchema);
export const ZSiteAPIResponse = new Zod(createAPIResponseSchema(siteResultSchema));

export type SiteResult = z.infer<typeof siteResultSchema>;