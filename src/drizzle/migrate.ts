import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

export const client = createClient({
    url: Bun.env.TURSO_DB_URL!,
    authToken: Bun.env.TURSO_DB_AUTH_TOKEN!,
});

export const db = drizzle(client);

async function main() {
    try {
        await migrate(db, {
            migrationsFolder: "./migrations",
        });
        console.log("Tables migrated!");
        process.exit(0);
    } catch (error) {
        console.error("Error performing migration: ", error);
        process.exit(1);
    }
}

main();