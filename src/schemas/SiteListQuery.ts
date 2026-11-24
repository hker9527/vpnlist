import { z } from "zod";
import { SITES } from "../const";

const site = z.enum(SITES);

export const SiteListQuerySchema = z.union([site, site.array()])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .optional();
