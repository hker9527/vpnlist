import { z } from "zod";

export const LoginResponseSchema = z.union([
    z.object({
        result_code: z.literal(100),
        data: z.object({
            url: z.string(),
        }),
        error: z.null(),
    }),
    z.object({
        result_code: z.number(),
        data: z.object({
            url: z.string(),
        }),
        error: z.string(),
    })
]);

export type LoginResponse = z.infer<typeof LoginResponseSchema>;