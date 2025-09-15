export const SITES = [
    "uma",
    "dmm",
    "umag"
] as const;

export type Site = typeof SITES[number];

export const VARIANTS = [
    "legacy",
    "current",
    "beta"
] as const;

export type Variant = typeof VARIANTS[number];