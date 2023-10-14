import { createClient } from "@libsql/client";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import * as schema from "../drizzle/schema";

let db: LibSQLDatabase<typeof schema>;

export const buildClient = (url: string, authToken?: string) => {
    const client = createClient({ url, authToken });
    db = drizzle(client, { schema });
};

export const getClient = () => {
    return db;
};
