import { z } from "zod";
import { Zod } from "../zod";
import { createAPIResponseSchema } from "./base";

const serverResultSchema = z.object({
    country: z.string(),
    lat: z.number(),
    lon: z.number(),
    speed: z.number(),
    asn: z.object({
        id: z.string(),
        name: z.string()
    })
});

export const ZServerResult = new Zod(serverResultSchema);
export const ZServerAPIResponse = new Zod(createAPIResponseSchema(serverResultSchema));

export type ServerResult = z.infer<typeof serverResultSchema>;