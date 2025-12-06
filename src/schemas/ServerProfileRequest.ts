import { z } from "zod";
import { VARIANTS } from "../const";

export const ServerProfileRequestSchema = z.object({
    ip: z.ipv4(),
    variant: z.enum(VARIANTS),
    split: z.stringbool("true").optional()
});

export type ServerProfileRequest = z.infer<typeof ServerProfileRequestSchema>;