import { type Variant } from "~/lib/Variant";
import { BaseMigration } from ".";
import { type Shape as LastShape } from "./001_init";

export interface Shape {
    country: string | null;
    take: number;
    orderBy: "timestamp" | "duration" | "speed";
    sites: string[];

    variant: Variant;
    split?: true;
}

export const defaultSettings: Shape = {
    country: "JP",
    take: 5,
    orderBy: "timestamp",
    sites: ["uma"],
    variant: "beta",
    split: true
};

export class Migration extends BaseMigration {
    version = 2;

    up(previous: LastShape): Shape {
        return {
            ...previous,
            variant: "beta",
            split: true
        };
    }

    down(_: Shape): LastShape {
        const { variant, split, ...rest } = _;
        return rest;
    }
}