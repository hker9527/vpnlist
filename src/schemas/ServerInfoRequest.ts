import { z } from "zod";

export const ServerInfoRequestSchema = z.object({
    ip: z.ipv4()
});

export type ServerInfoRequest = z.infer<typeof ServerInfoRequestSchema>;