import { debug, error, log } from "./Reporting";
import { checkedRecently, insertAsn, insertResults, insertServer, updateStatistic } from "./drizzle/client";
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

        ret = {
            server: {
                ip: server.ip,
                country: ipinfo.country,
                lat,
                lon,
                speed: server.speed.toString(),
                config: server.config
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
    await proc.exited;

    debug("main", `Finished testing ${server.ip}`);

    return ret;
};

const main = async () => {
    log("main", "Initializing testers...");

    for (const tester of testers) {
        debug("main", `Initializing ${tester.constructor.name}...`);
        const result = await tester.init();

        if (!result) {
            error("main", `Failed to initialize ${tester.constructor.name}`);
            return;
        }
    }

    log("main", "Updating server list...");
    const servers = await fetchServers();

    if (servers === null) {
        error("main", "Failed to update list");
        return;
    }

    let serverTested = 0;
    let serverSkipped = 0;

    log("main", `Testing ${servers.length} servers...`);
    for (const server of servers) {
        try {
            if (await checkedRecently(server.ip)) {
                debug("main", `Skipping ${server.ip} because it was checked recently`);
                serverSkipped++;
                continue;
            }

            const result = await test(server);

            if (result) {
                await insertAsn({
                    asn: result.asn
                });
                await insertServer({
                    asnId: result.asn.id,
                    server: result.server
                });
                await insertResults({
                    ip: result.server.ip,
                    results: result.results
                });
                await updateStatistic("serverTested", 1);
                serverTested++;
            }
        } catch (e) {
            error("main", e);
        }
    }

    log("main", `Tested ${serverTested} servers, skipped ${serverSkipped} servers`);

    setTimeout(main, 30 * 60 * 1000);
};

main();