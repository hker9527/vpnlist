import type { Config } from "drizzle-kit";

export default {
    out: "./migrations",
    schema: "./src/drizzle/schema.ts"
} satisfies Config;