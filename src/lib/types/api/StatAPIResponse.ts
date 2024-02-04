import { z } from "zod";
import { Zod } from "../zod";
import { createAPIResponseSchema } from "./base";

const statResultSchema = z.array(z.object({
    country: z.string(),
    success: z.number(),
    fail: z.number()
}));

export const ZStatResult = new Zod(statResultSchema);
export const ZStatAPIResponse = new Zod(createAPIResponseSchema(statResultSchema));

export type StatResult = z.infer<typeof statResultSchema>;