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

test.each(["legacy", "current", "beta"])("split %s profiles include game and diagnostic routes", async (variant) => {
    const response = await download(`variant=${variant}&split=true`);
    expect(response.status).toBe(200);

    const lines = (await response.text()).split(/\r?\n/);
    expect(lines).toContain("route-nopull");
    expect(lines).toContain("route api.games.umamusume.com");
    expect(lines).toContain("route assets-umamusume-en.akamaized.net");
    expect(lines).not.toContain("route umamusume.com");
    expect(lines).not.toContain("dns search-domains umamusume.com");
    expect(lines).toContain("route api.games.umamusume.jp");
    expect(lines).toContain("route apidgp-gameplayer.games.dmm.com");
    expect(lines).toContain("route tv.dmm.com");
    expect(lines).toContain("route www.gco.gov.qa");
    expect(lines).not.toContain("route ipv4.seeip.org");
    expect(lines).not.toContain("route tls13.cloudflare.com");
    expect(lines).not.toContain("route cloudflare-quic.com");
    expect(lines).not.toContain("route umavpn.top");
    expect(lines.includes("dns search-domains api.games.umamusume.com")).toBe(variant === "beta");
    expect(lines.includes("dns search-domains assets-umamusume-en.akamaized.net")).toBe(variant === "beta");
    expect(lines).toContain("block-ipv6");
});

test.each(["", "&split=true"])("IPv6 blocking works by default and with blockIpv6=true (%s)", async (split) => {
    for (const option of ["", "&blockIpv6=true"]) {
        const response = await download(`variant=current${split}${option}`);
        expect(response.status).toBe(200);

        const lines = (await response.text()).split(/\r?\n/);
        expect(lines).toContain("block-ipv6");
        expect(lines).toContain("ifconfig-ipv6 fd15:53b6:dead::2/64 fd15:53b6:dead::1");
        expect(lines).toContain("route-ipv6 2000::/3");
        expect(lines.includes("route-nopull")).toBe(Boolean(split));
        expect(lines.includes("route api.games.umamusume.com")).toBe(Boolean(split));
        expect(lines.includes("route tv.dmm.com")).toBe(Boolean(split));
        expect(lines.includes("route www.gco.gov.qa")).toBe(Boolean(split));
    }
});

test.each(["", "&split=true"])("explicit IPv6 opt-out preserves the profile's IPv4 routes (%s)", async (split) => {
    const response = await download(`variant=legacy&blockIpv6=false${split}`);
    expect(response.status).toBe(200);

    const content = await response.text();
    expect(content).not.toMatch(/^(route-ipv6|block-ipv6|ifconfig-ipv6)/m);
    expect(content.includes("route api.games.umamusume.com")).toBe(Boolean(split));
});

test("invalid IPv6 option returns 400", async () => {
    expect((await download("variant=current&blockIpv6=maybe")).status).toBe(400);
});
