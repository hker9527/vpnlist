export const orderByOptions = ["timestamp", "duration", "speed"] as const;

export const orderByLabels: Record<(typeof orderByOptions)[number], string> = {
    timestamp: "Most recent",
    duration: "Lowest ping",
    speed: "Fastest speed"
};
