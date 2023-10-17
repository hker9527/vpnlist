import { error } from "console";
import { timeoutPromise } from "../utils";
import * as csv from "csv-parse/sync";
import { zparse } from "../type/_parse";
import { debug } from "../Reporting";
import { VPNGateServer } from "../type/VPNGateServer";
import { APIVPNGateServer, ZAPIVPNGateServer } from "../type/api/vpngate";

export const fetchServers = async (): Promise<VPNGateServer[] | null> => {
    try {
        debug("VPNGate.fetchServers", "Fetching list...");
        const request = await Promise.race<Response | null>([
            timeoutPromise(5000),
            fetch("https://www.vpngate.net/api/iphone/")
        ]);

        if (request === null) {
            debug("VPNGate.fetchServers", "Request timed out");
            return null;
        }
        
        const text = await request.text();

        const lines = text.split("\n");
        lines.shift();
        lines[0] = lines[0].substring(1); // Starting *
        lines.pop();
        lines.pop();

        const list = (csv.parse(lines.join("\n"), { columns: true, relax_quotes: true, cast: true }) as unknown[])
            .map((obj) => zparse(ZAPIVPNGateServer, obj))
            .filter((obj): obj is APIVPNGateServer => obj !== null)
            .sort((s1, s2) => s1.Speed - s2.Speed);

        debug("VPNGate.fetchServers", `Fetched ${list.length} servers`);
        
        return list.map((server) => {
            let config = Buffer.from(server.OpenVPN_ConfigData_Base64, "base64").toString("utf-8");
            // Strip comments starting with ; and #
            config = config.replace(/^(?:;|#).*/gm, "");
            // Strip empty lines (DOS style)
            config = config.replace(/^\r\n/gm, "");
            // Add data-ciphers option after cipher option for OpenVPN 2.6+ compatibility
            config = config.replace(/^cipher\s+(.*)$/gm, "cipher $1\r\ndata-ciphers $1");

            return {
                ip: server.IP,
                speed: server.Speed / 1024 / 1024, // Convert to Mbps
                config
            }
        });
    } catch (e) {
        error("VPNGate.fetchServers", e);
        return null;
    }
}