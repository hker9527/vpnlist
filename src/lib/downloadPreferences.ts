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
    ios: "iOS",
    windows: "Windows",
    macos: "macOS",
    linux: "Linux",
    other: "Other",
};

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
    if (/Android/i.test(userAgent)) return "android";
    if (/iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return "ios";
    if (/Windows/i.test(userAgent)) return "windows";
    if (/Macintosh|Mac OS X/i.test(userAgent)) return "macos";
    if (/Linux/i.test(userAgent)) return "linux";
    return "other";
}
