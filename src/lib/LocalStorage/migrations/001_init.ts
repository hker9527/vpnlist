import { orderByOptions } from "~/lib/types/enums/OrderByOptions";
import { BaseMigration } from ".";
import { z } from "zod";

export const ShapeSchema = z.object({
    country: z.string().nullable(),
    take: z.number(),
    orderBy: z.enum(orderByOptions),
    sites: z.array(z.string())
});

export type Shape = z.infer<typeof ShapeSchema>;

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