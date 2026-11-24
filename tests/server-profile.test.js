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
});
