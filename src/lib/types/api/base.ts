import { z } from "zod";

export const createAPIResponseSchema = <T extends z.ZodTypeAny>(data: T) => {
    return z.discriminatedUnion("success", [z.object({
        success: z.literal(true),
        data,
    }), z.object({
        success: z.literal(false),
        data: z.null(),
    })]);
};