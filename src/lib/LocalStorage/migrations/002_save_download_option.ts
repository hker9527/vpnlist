import { variants } from "~/lib/types/enums/Variants";
import { BaseMigration } from ".";
import { type Shape as LastShape } from "./001_init";
import { z } from "zod";
import { orderByOptions } from "~/lib/types/enums/OrderByOptions";

export const ShapeSchema = z.object({
    country: z.string().nullable(),
    take: z.number(),
    orderBy: z.enum(orderByOptions),
    sites: z.array(z.string()),
    variant: z.enum(variants),
    split: z.boolean().optional()
});

export type Shape = z.infer<typeof ShapeSchema>;

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