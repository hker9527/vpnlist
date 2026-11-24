import { afterAll, expect, spyOn, test } from "bun:test";
import worker from "../src/index";
import { ServerRepository } from "../src/repositories/ServerRepository";

const server = spyOn(ServerRepository.prototype, "getServerConfigByIp").mockResolvedValue({
    ip: "192.0.2.1",
    port: 1194,
    proto: "udp",
    ca: "test-ca",
    cert: "test-cert",
    key: "test-key"
});

afterAll(() => server.mockRestore());

function download(query) {
    return worker.fetch(new Request(`https://example.test/api/server/192.0.2.1/config?${query}`), {
        DATABASE_URL: "postgres://localhost/test"
    });
}

const siteDomains = {
    uma: [
        "api-umamusume.cygames.jp",
        "api.games.umamusume.jp",
        "prd-storage-app-umamusume.akamaized.net",
        "prd-storage-game-umamusume.akamaized.net",
        "prd-info-umamusume.akamaized.net"
    ],
    umag: ["api.games.umamusume.com", "assets-umamusume-en.akamaized.net"],
    dmm: ["apidgp-gameplayer.games.dmm.com", "tv.dmm.com"]
};

function routes(lines) {
    return lines.filter(line => line.startsWith("route "));
}

function dns(lines) {
    return lines.filter(line => line.startsWith("dns search-domains "));
}

function splitRoutes(domains) {
    return [...domains, "www.gco.gov.qa"].map(domain => `route ${domain}`);
}

async function profileLines(query) {
    const response = await download(query);
    expect(response.status).toBe(200);
    return (await response.text()).split(/\r?\n/);
}

test("split profiles without sites keep all route groups", async () => {
    const lines = await profileLines("variant=current&split=true");
    expect(lines).toContain("route-nopull");
    expect(routes(lines)).toEqual(splitRoutes(Object.values(siteDomains).flat()));
    expect(dns(lines)).toEqual([]);
    expect(lines).toContain("block-ipv6");
});

test.each(Object.entries(siteDomains))("split profile for %s includes only that site's routes", async (site, domains) => {
    const lines = await profileLines(`variant=current&split=true&sites=${site}`);
    expect(routes(lines)).toEqual(splitRoutes(domains));
});

test("beta split profiles use repeated site codes for routes and DNS without duplicates", async () => {
    const lines = await profileLines("variant=beta&split=true&sites=umag&sites=dmm&sites=umag");
    expect(routes(lines)).toEqual(splitRoutes([...siteDomains.umag, ...siteDomains.dmm]));
    expect(dns(lines)).toEqual([
        "dns search-domains api.games.umamusume.com",
        "dns search-domains assets-umamusume-en.akamaized.net",
        "dns search-domains apidgp-gameplayer.games.dmm.com"
    ]);
});

test("original profiles ignore sites and still block IPv6 by default", async () => {
    const lines = await profileLines("variant=beta&sites=dmm");
    expect(lines).not.toContain("route-nopull");
    expect(routes(lines)).toEqual([]);
    expect(dns(lines)).toEqual([]);
    expect(lines).toContain("ifconfig-ipv6 fd15:53b6:dead::2/64 fd15:53b6:dead::1");
    expect(lines).toContain("route-ipv6 2000::/3");
    expect(lines).toContain("block-ipv6");
});

test("IPv6 opt-out preserves the selected IPv4 route group", async () => {
    const lines = await profileLines("variant=legacy&split=true&blockIpv6=false&sites=umag");
    expect(lines.join("\n")).not.toMatch(/^(route-ipv6|block-ipv6|ifconfig-ipv6)/m);
    expect(routes(lines)).toEqual(splitRoutes(siteDomains.umag));
});

test("unknown site codes return 400", async () => {
    expect((await download("variant=current&split=true&sites=uma&sites=unknown")).status).toBe(400);
});

test("invalid IPv6 option returns 400", async () => {
    expect((await download("variant=current&blockIpv6=maybe")).status).toBe(400);
});
