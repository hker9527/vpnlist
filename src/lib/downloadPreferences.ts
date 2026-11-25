export const downloadVariants = ["beta", "current"] as const;
export type DownloadVariant = (typeof downloadVariants)[number];

export const downloadVariantLabels: Record<DownloadVariant, string> = {
    beta: "2.7.x",
    current: "2.6.x",
};

export const platformOptions = ["auto", "android", "ios", "windows", "macos", "linux", "other"] as const;
export type PlatformPreference = (typeof platformOptions)[number];
export type Platform = Exclude<PlatformPreference, "auto">;

export const platformLabels: Record<Platform, string> = {
    android: "Android",
    ios: "iOS / iPadOS",
    windows: "Windows",
    macos: "macOS",
    linux: "Linux",
    other: "Other",
};

export const recommendedClients: Record<Platform, { name: string; url: string } | null> = {
    android: { name: "OpenVPN for Android", url: "https://play.google.com/store/apps/details?id=de.blinkt.openvpn" },
    ios: { name: "OpenVPN Connect", url: "https://apps.apple.com/app/openvpn-connect/id590379981" },
    windows: { name: "OpenVPN GUI (Community)", url: "https://community.openvpn.net/Downloads" },
    macos: { name: "Tunnelblick", url: "https://tunnelblick.net/downloads.html" },
    linux: { name: "OpenVPN Community CLI", url: "https://openvpn.net/community-docs/installing-openvpn" },
    other: null,
};

export function resolvePlatform(preference: PlatformPreference, detected: Platform): Platform {
    return preference === "auto" ? detected : preference;
}

export function shouldBlockIpv6(platform: Platform, override?: boolean): boolean {
    return override ?? (platform !== "ios" && platform !== "other");
}

export function buildProfileDownloadUrl(
    host: string,
    ip: string,
    platform: Platform,
    { variant, split, blockIpv6 }: { variant: DownloadVariant; split: boolean; blockIpv6?: boolean },
): string {
    const url = new URL(`${host}/api/server/${ip}/config`);
    url.searchParams.set("variant", variant);
    if (split) url.searchParams.set("split", "true");
    url.searchParams.set("blockIpv6", String(shouldBlockIpv6(platform, blockIpv6)));
    return url.toString();
}

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
    if (/Android/i.test(userAgent)) return "android";
    if (/iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return "ios";
    if (/Windows/i.test(userAgent)) return "windows";
    if (/Macintosh|Mac OS X/i.test(userAgent)) return "macos";
    if (/Linux/i.test(userAgent)) return "linux";
    return "other";
}
