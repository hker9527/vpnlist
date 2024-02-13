import assert from "assert-ts";
import { debug, error, log } from "./Reporting";
import { PrismaDatabase } from "./db";
// import { checkedRecently, insertAsn, insertResults, insertServer, updateStatistic } from "./drizzle/client";
import { lookup } from "./repo/IPInfo";
import { fetchServers } from "./repo/VPNGate";
import { DMMTester } from "./tester/dmm";
import { UmaTester } from "./tester/uma";
import { ServerResult } from "./type/ServerResult";
import { SiteResult } from "./type/SiteResult";
import { VPNGateServer } from "./type/VPNGateServer";
import { timeoutPromise } from "./utils";

const testers = [
    new UmaTester(),
    new DMMTester()
];

const test = async (server: VPNGateServer) => {
    let ret: ServerResult | null = null;

    debug("main", `Server ${server.ip} has speed ${server.speed}Mbps`);

    // Patch the config we use to use route-nopull,
    // which prevents openvpn from changing the routing table
    const _config = server.config + "\r\nroute-nopull";

    // Write config to file
    const configPath = "/tmp/vpngate.conf";
    await Bun.write(configPath, _config);

    // Connect to server
    const proc = Bun.spawn(["sudo", "openvpn", "--config", configPath]);

    let resolved = false;

    const device = await Promise.race<string | null>([
        new Promise(async (resolve) => {
            await timeoutPromise(15 * 1000);
            if (resolved) return;
            debug("connect", "Timed out");
            resolve(null);
            resolved = true;
        }),
        // Check if the process has exited
        new Promise(async (resolve) => {
            await proc.exited;
            if (resolved) return;
            debug("connect", `Process exited with code ${proc.exitCode} and signal ${proc.signalCode}`);
            resolve(null);
            resolved = true;
        }),
        // Check if the process has connected
        new Promise(async (resolve) => {
            const stdout = proc.stdout;
            const reader = stdout.getReader();

            let output = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // debug("stdout", output);
                    resolve(null);
                    break;
                }

                output += new TextDecoder().decode(value);
                let match;

                if (output.includes("Initialization Sequence Completed")) {
                    const device = (output.match(/TUN\/TAP device (.*?) opened/) ?? [])[1];
                    if (device) {
                        resolve(device);
                    } else {
                        debug("connect", `Failed to connect: Could not find device name`);
                        resolve(null);
                    }
                    break;
                } else if ((match = output.match(/failed: (.*)/))) {
                    debug("connect", `Failed to connect: ${match[1]}`);
                    resolve(null);
                    break;
                } else if (output.includes("AUTH_FAILED")) {
                    debug("connect", `Failed to connect: AUTH_FAILED`);
                    resolve(null);
                    break;
                }
            }

            reader.releaseLock();
            resolved = true;
        })
    ]);

    if (device === null) {
        debug("main", `Failed to connect to ${server.ip}`);
    } else {
        debug("main", `Connected to ${server.ip} on device ${device}`);

        // Test for site accessiblity
        const results: SiteResult[] = await Promise.all(testers.map(async (tester) => tester.test(device)));

        for (const result of results) {
            if (result.success) {
                debug("main", `Site ${result.site}: ${result.duration}ms`);
            } else {
                debug("main", `Site ${result.site}: Failed`);
            }
        }

        // Get IP info
        const ipinfo = await lookup(server.ip);

        const [lat, lon] = ipinfo.loc.split(",");

        const parts = ipinfo.org.split(" ");
        const asnId = parts.shift()!;
        const asnName = parts.join(" ");

        // Parse OpenVPN config
        const config = {
            port: -1,
            proto: "",
            caLines: [] as string[],
            certLines: [] as string[],
            keyLines: [] as string[]
        };

        const flags = {
            ca: false,
            cert: false,
            key: false
        };

        for (const line of server.config.split("\r\n")) {
            const lineArgs = line.trim().split(" ");

            switch (lineArgs[0]) {
                case "proto":
                    config.proto = lineArgs[1];
                    break;
                case "remote":
                    config.port = parseInt(lineArgs[2]);
                    break;
                case "<ca>":
                    flags.ca = true;
                    break;
                case "</ca>":
                    flags.ca = false;
                    break;
                case "<cert>":
                    flags.cert = true;
                    break;
                case "</cert>":
                    flags.cert = false;
                    break;
                case "<key>":
                    flags.key = true;
                    break;
                case "</key>":
                    flags.key = false;
                    break;
                default:
                    if (flags.ca) {
                        config.caLines.push(line.trim());
                    } else if (flags.cert) {
                        config.certLines.push(line.trim());
                    } else if (flags.key) {
                        config.keyLines.push(line.trim());
                    }
                    break;
            }
        }

        assert(config.port !== -1, "Failed to parse port");
        assert(config.proto !== "", "Failed to parse proto");
        assert(config.caLines.length > 0, "Failed to parse ca");
        assert(config.certLines.length > 0, "Failed to parse cert");
        assert(config.keyLines.length > 0, "Failed to parse key");

        ret = {
            server: {
                ip: server.ip,
                country: ipinfo.country,
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                speed: server.speed
            },
            config: {
                port: config.port,
                proto: config.proto,
                ca: config.caLines.join("\r\n"),
                cert: config.certLines.join("\r\n"),
                key: config.keyLines.join("\r\n")
            },
            asn: {
                id: asnId,
                name: asnName
            },
            results
        };
    }

    debug("main", `Killing process ${proc.pid}`);
    Bun.spawnSync(["sudo", "kill", proc.pid.toString()]);
    const exited = await Promise.race([proc.exited, timeoutPromise(5 * 1000)]);

    if (exited === null) {
        debug("main", `Failed to kill process ${proc.pid}`);
    }

    debug("main", `Finished testing ${server.ip}`);

    return ret;
};

log("main", "Initializing testers...");

for (const tester of testers) {
    debug("main", `Initializing ${tester.constructor.name}...`);
    const result = await tester.init();

    if (!result) {
        error("main", `Failed to initialize ${tester.constructor.name}`);
        process.exit(1);
    }
}

setTimeout(() => {
    log("main", "Exiting program after 45 minutes");
    process.exit(1);
}, 45 * 60 * 1000);

const database = new PrismaDatabase(Bun.env.DATABASE_URL!);

log("main", "Updating server list...");
const servers = await fetchServers();

if (servers === null) {
    error("main", "Failed to update list");
    process.exit(1);
}

let serverTested = 0;
let serverSkipped = 0;

log("main", `Testing ${servers.length} servers...`);
for (const server of servers) {
    try {
        if (await database.isServerCheckedRecently(server.ip)) {
            debug("main", `Skipping ${server.ip} because it was checked recently`);
            serverSkipped++;
            continue;
        }

        const result = await test(server);

        if (result) {
            await database.upsertASN(result.asn);

            const serverCa = await database.upsertServerCA(result.config.ca);
            const serverCert = await database.upsertServerCert(result.config.cert);
            const serverKey = await database.upsertServerKey(result.config.key);

            await database.upsertServer({
                ...result.server,
                port: result.config.port,
                proto: result.config.proto,
                caId: serverCa.id,
                certId: serverCert.id,
                keyId: serverKey.id,
                asnId: result.asn.id
            });
            await database.insertResults(result.server.ip, result.results);
            await database.updateStatistic("serverTested", 1);
            serverTested++;
        }
    } catch (e) {
        error("main", e);
    }
}

log("main", `Tested ${serverTested} servers, skipped ${serverSkipped} servers`);
process.exit(0);