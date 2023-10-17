import { z } from "zod";

export const userInfoResponseSchema = z.object({
    result_code: z.number(),
    error: z.string().nullable()
});