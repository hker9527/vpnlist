import { BaseMigration } from ".";

export interface Shape {
    country: string | null;
    take: number;
    orderBy: "timestamp" | "duration" | "speed";
    sites: string[];
}

export const defaultSettings: Shape = {
    country: "JP",
    take: 5,
    orderBy: "timestamp",
    sites: ["uma"]
};

export class Migration extends BaseMigration {
    version = 1;

    up(): Shape {
        return defaultSettings;
    }

    down() {
        return {};
    }
}