import { z } from "zod";
import { SITES } from "../const";

export const StatisticRequestSchema = z.object({
    site: z.enum(SITES)
});

export type StatisticRequest = z.infer<typeof StatisticRequestSchema>;