import { expect, test } from "bun:test";
import { compareSplitRoute, maskIp, parseIpTrace } from "../src/lib/ipTrace";

test("reads the address and country without exposing other trace fields", () => {
    expect(parseIpTrace("ip=192.0.2.1\ncolo=NRT\nuag=Example browser\nloc=JP\n")).toEqual({
        ip: "192.0.2.1",
        country: "Japan",
    });
});

test("accepts IPv6 without a known country", () => {
    expect(parseIpTrace("ip=2001:db8::2\r\nloc=XX\r\n")).toEqual({
        ip: "2001:db8::2",
        country: undefined,
    });
});

test("rejects a missing or invalid IP address", () => {
    expect(parseIpTrace("loc=JP")).toBeUndefined();
    expect(parseIpTrace("ip=invalid\nloc=JP")).toBeUndefined();
});

test("compares full IPv4 addresses and treats IPv6 or missing results as inconclusive", () => {
    const direct = parseIpTrace("ip=192.0.2.1");
    expect(compareSplitRoute(direct, parseIpTrace("ip=192.0.2.2"))).toBe("different");
    expect(compareSplitRoute(direct, direct)).toBe("same");
    expect(compareSplitRoute(direct, parseIpTrace("ip=2001:db8::2"))).toBe("ipv6");
    expect(compareSplitRoute(direct, undefined)).toBe("unavailable");
});

test("masks the last two IPv4 octets and keeps only an IPv6 prefix", () => {
    expect(maskIp("192.0.2.1")).toBe("192.0.x.x");
    expect(maskIp("2001:db8::2")).toBe("2001:db8:…");
    expect(maskIp("::ffff:192.0.2.1")).toBe("0:0:…");
});
