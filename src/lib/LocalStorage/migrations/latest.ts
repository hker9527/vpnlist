import { z } from "zod";
import * as Latest from "./003_download_preferences";

// An absent override uses the platform default, including for existing settings.
export const ShapeSchema = Latest.ShapeSchema.extend({
    blockIpv6: z.boolean().optional(),
});
export type Shape = z.infer<typeof ShapeSchema>;
export const defaultSettings: Shape = Latest.defaultSettings;

export class Migration extends Latest.Migration {}
