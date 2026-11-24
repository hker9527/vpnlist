import * as Latest from "./003_download_preferences";

export const ShapeSchema = Latest.ShapeSchema;
export type Shape = Latest.Shape;
export const defaultSettings: Shape = Latest.defaultSettings;

export class Migration extends Latest.Migration {}
