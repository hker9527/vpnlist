import { z } from "zod";

export const ZAPIVPNGateServer = z.object({
    HostName: z.string().min(1),
    IP: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/),
    Score: z.number().min(0),
    Ping: z.number().min(0),
    Speed: z.number().min(0),
    CountryLong: z.string().min(1),
    CountryShort: z.string().min(1),
    NumVpnSessions: z.number().min(0),
    Uptime: z.number().min(0),
    TotalUsers: z.number().min(0),
    TotalTraffic: z.number().min(0),
    LogType: z.string().min(1),
    Operator: z.string().min(1),
    Message: z.string(),
    OpenVPN_ConfigData_Base64: z.string().min(1).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)
});

export type APIVPNGateServer = z.infer<typeof ZAPIVPNGateServer>;