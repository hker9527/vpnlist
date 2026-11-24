export const minResultCount = 1;
export const maxResultCount = 20;

export function normalizeResultCount(take: number, fallback: number) {
    return Number.isFinite(take)
        ? Math.min(maxResultCount, Math.max(minResultCount, Math.round(take)))
        : fallback;
}
