export const SITES = [
    "uma",
    "dmm"
] as const;

export type Site = typeof SITES[number];

export const VARIANTS = [
    "legacy",
    "current"
];

export const PATCH = `
# Patched by Nasu VPN Checker
route-nopull

route api-umamusume.cygames.jp
route prd-storage-umamusume.akamaized.net
route prd-storage-app-umamusume.akamaized.net
route prd-storage-game-umamusume.akamaized.net
route prd-info-umamusume.akamaized.net

route apidgp-gameplayer.games.dmm.com
`.replaceAll("\n", "\r\n");