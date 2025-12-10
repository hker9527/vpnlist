import { z } from "zod";

export const AccessTokenResponseSchema = z.object({
    result_code: z.number(),
    data: z.object({
        access_token: z.string(),
    }),
    error: z.string().nullable(),
});

export type AccessTokenResponse = z.infer<typeof AccessTokenResponseSchema>;
