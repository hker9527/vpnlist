import { z } from "zod";
import { downloadVariants, platformOptions } from "../../downloadPreferences";
import { BaseMigration } from ".";
import {
    defaultSettings as previousDefaults,
    ShapeSchema as PreviousSchema,
    type Shape as LastShape
} from "./002_save_download_option";

export const ShapeSchema = PreviousSchema.extend({
    variant: z.enum(downloadVariants),
    split: z.boolean(),
    platform: z.enum(platformOptions)
});

export type Shape = z.infer<typeof ShapeSchema>;

export const defaultSettings: Shape = {
    ...previousDefaults,
    variant: "beta",
    split: false,
    platform: "auto"
};

export class Migration extends BaseMigration {
    version = 3;

    up(previous: LastShape): Shape {
        return {
            ...previous,
            variant: previous.variant === "current" ? "current" : defaultSettings.variant,
            // Version 2 saved a placeholder split preference that the menu never used.
            split: defaultSettings.split,
            platform: defaultSettings.platform
        };
    }

    down({ platform, ...previous }: Shape): LastShape {
        return previous;
    }
}
