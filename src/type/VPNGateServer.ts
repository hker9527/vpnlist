import { APIVPNGateServer } from "./api/vpngate";

export interface VPNGateServer {
    ip: string;
    speed: APIVPNGateServer["Speed"];
    config: APIVPNGateServer["OpenVPN_ConfigData_Base64"];
};