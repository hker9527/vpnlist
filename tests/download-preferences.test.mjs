import { expect, test } from "bun:test";
import {
    buildProfileDownloadUrl,
    detectPlatform,
    recommendedClients,
    resolvePlatform,
    shouldBlockIpv6,
} from "../src/lib/downloadPreferences";
import { Settings } from "../src/lib/LocalStorage";
import { defaultSettings as previousDefaults } from "../src/lib/LocalStorage/migrations/002_save_download_option";
import { defaultSettings, Migration, ShapeSchema } from "../src/lib/LocalStorage/migrations/003_download_preferences";

test.each([
    ["Mozilla/5.0 (Linux; Android 14; Pixel 8)", 5, "android"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 5, "ios"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5, "ios"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0, "macos"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 0, "windows"],
    ["Mozilla/5.0 (X11; Linux x86_64)", 0, "linux"],
    ["", 0, "other"],
])("detects %s with %i touch points as %s", (userAgent, maxTouchPoints, platform) => {
    expect(detectPlatform(userAgent, maxTouchPoints)).toBe(platform);
});

test("client recommendation follows the effective platform", () => {
    expect(recommendedClients[resolvePlatform("auto", "ios")].name).toBe("OpenVPN Connect");
    expect(recommendedClients[resolvePlatform("android", "ios")].name).toBe("OpenVPN for Android");
    expect(recommendedClients[resolvePlatform("other", "ios")]).toBeNull();
});

test.each([
    ["ios", false],
    ["other", false],
    ["android", true],
    ["windows", true],
    ["macos", true],
    ["linux", true],
])("defaults IPv6 blocking on %s to %s", (platform, blocked) => {
    expect(shouldBlockIpv6(platform)).toBe(blocked);
    expect(shouldBlockIpv6(platform, true)).toBe(true);
    expect(shouldBlockIpv6(platform, false)).toBe(false);
});

test("profile URLs carry the IPv6 option without changing split or sites behavior", () => {
    const host = "https://api.example.com";
    const ip = "192.0.2.1";
    const original = new URL(buildProfileDownloadUrl(host, ip, "ios", { variant: "beta", split: false }));
    expect(original.pathname).toBe(`/api/server/${ip}/config`);
    expect([...original.searchParams]).toEqual([["variant", "beta"], ["blockIpv6", "false"]]);

    const split = new URL(buildProfileDownloadUrl(host, ip, "ios", { variant: "current", split: true, blockIpv6: true }));
    expect([...split.searchParams]).toEqual([["variant", "current"], ["split", "true"], ["blockIpv6", "true"]]);
});

test("upgrades stored filters without activating the old placeholder split preference", () => {
    const migration = new Migration();
    const filters = { country: "US", take: 12, orderBy: "speed", sites: ["umag"] };
    const upgraded = migration.up({ ...filters, variant: "legacy", split: true });

    expect(ShapeSchema.parse(upgraded)).toEqual({
        ...filters,
        variant: "beta",
        split: false,
        platform: "auto",
    });
    expect(migration.up({ ...filters, variant: "current" }).variant).toBe("current");
    expect(migration.down({ ...upgraded, platform: "android" })).toEqual({
        ...filters,
        variant: "beta",
        split: false,
    });
});

function withStorage(entries, testStorage) {
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const storage = new Map(Object.entries(entries));
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
        },
    });
    try {
        testStorage(storage);
    } finally {
        if (original) Object.defineProperty(globalThis, "localStorage", original);
        else delete globalThis.localStorage;
    }
}

test.each([
    ["first-time", {}],
    ["returning", { version: "2", settings: JSON.stringify(previousDefaults) }],
])("%s users keep the settings hint until they open Settings", (_userType, entries) => {
    withStorage(entries, (storage) => {
        expect(new Settings().hasDownloadSettingsHint()).toBe(true);
        expect(storage.get("version")).toBe(String(new Migration().version));

        const reloaded = new Settings();
        expect(reloaded.hasDownloadSettingsHint()).toBe(true);
        reloaded.dismissDownloadSettingsHint();
        expect(new Settings().hasDownloadSettingsHint()).toBe(false);
    });
});

test("already-current users do not see a new settings hint", () => {
    withStorage({ version: String(new Migration().version), settings: JSON.stringify(defaultSettings) }, () => {
        expect(new Settings().hasDownloadSettingsHint()).toBe(false);
        expect(new Settings().hasDownloadSettingsHint()).toBe(false);
    });
});

test("existing settings use the platform default until an override is saved", () => {
    withStorage({ version: String(new Migration().version), settings: JSON.stringify(defaultSettings) }, () => {
        const settings = new Settings();
        expect(settings.load().blockIpv6).toBeUndefined();
        settings.save({ ...settings.load(), blockIpv6: false });
        expect(new Settings().load().blockIpv6).toBe(false);
    });
});
