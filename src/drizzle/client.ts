import { createClient } from "@libsql/client";
import assert from "assert-ts";
import { and, eq, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { hostname } from "os";
import { lookup } from "../repo/IPInfo";
import { SiteResult } from "../type/SiteResult";
import * as schema from "./schema";
import { debug, error, log } from "../Reporting";

export const client = createClient({
    url: Bun.env.TURSO_DB_URL!,
    authToken: Bun.env.TURSO_DB_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });

let testerId: number;

const fetchTesterId = async () => {
    const testerResult = await db.query.testerTable.findFirst({
        where: eq(schema.testerTable.name, hostname())
    }).execute();

    if (testerResult) {
        return testerResult.id;
    } else {
        const testerName = hostname();

        const ip = await fetch("https://api.ipify.org?format=json")
            .then(res => res.json())
            .then(res => res.ip);

        assert(ip !== undefined, "Failed to get ip");

        const ipinfo = await lookup(ip);
        const [lat, lon] = ipinfo.loc.split(",");

        const testerInsert = await db.insert(schema.testerTable)
            .values({
                name: testerName,
                country: ipinfo.country,
                lat,
                lon
            })
            .returning();

        assert(testerInsert.length === 1, "Expected tester to be inserted");

        return testerInsert[0].id;
    }
};

const queryRecentStatement = db.query.resultTable.findFirst({
    where: and(
        eq(schema.resultTable.testerId, sql.placeholder("testerId")),
        eq(schema.resultTable.ip, sql.placeholder("ip")),
        gt(schema.resultTable.timestamp, sql.placeholder("timestamp"))
    )
}).prepare();

// Check if a result exists in the past hour
export const checkedRecently = async (ip: string): Promise<boolean> => {
    try {
        if (!testerId) {
            testerId = await fetchTesterId();
        }

        const recent = await queryRecentStatement.execute({
            testerId,
            ip,
            timestamp: +new Date() - 60 * 60 * 1000
        });

        return recent !== undefined;
    } catch (e) {
        error("db.checkedRecently", e);
        return false;
    }
};

export const insertAsn = async (value: {
    asn: {
        id: string;
        name: string;
    }
}) => {
    try {
        await db.transaction(async tx => {
            try {
                // Find id by name in asnName
                const asnNameId = await (async () => {
                    const asnNameResult = await tx.query.asnNameTable.findFirst({
                        where: eq(schema.asnNameTable.name, value.asn.name)
                    }).execute();

                    if (asnNameResult) {
                        return asnNameResult.id;
                    } else {
                        const asnNameInsert = await tx.insert(schema.asnNameTable)
                            .values({
                                name: value.asn.name
                            })
                            .onConflictDoUpdate({
                                target: schema.asnNameTable.name,
                                set: {
                                    name: sql`${schema.asnNameTable.name}`
                                }
                            })
                            .returning();

                        assert(asnNameInsert.length === 1, "Expected asnName to be inserted");

                        return asnNameInsert[0].id;
                    }
                })();

                // Insert asn
                const asnInsert = await tx.insert(schema.asnTable)
                    .values({
                        id: value.asn.id,
                        asnNameId: asnNameId
                    })
                    .onConflictDoUpdate({
                        target: schema.asnTable.id,
                        set: {
                            asnNameId: asnNameId
                        }
                    })
                    .returning();

                assert(asnInsert.length === 1, "Expected asn to be inserted");
            } catch (e) {
                tx.rollback();
                throw e;
            }
        });

        return true;
    } catch (e) {
        error("db.insertASN", e);
        debug("db.insertASN", JSON.stringify(value));

        return false;
    }
};

export const insertServer = async (value: {
    asnId: string;
    server: {
        ip: string;
        country: string;
        lat: string;
        lon: string;
        speed: string;
        config: string;
    };
}): Promise<boolean> => {
    try {
        await db.transaction(async tx => {
            try {
                // Insert server
                const serverResults = await tx.insert(schema.serverTable)
                    .values({
                        ...value.server,
                        asnId: value.asnId
                    })
                    .onConflictDoUpdate({
                        target: schema.serverTable.ip,
                        set: {
                            country: value.server.country,
                            lat: value.server.lat,
                            lon: value.server.lon,
                            speed: value.server.speed,
                            config: value.server.config,
                            asnId: value.asnId
                        }
                    })
                    .returning();

                assert(serverResults.length === 1, "Expected server to be inserted");
            } catch (e) {
                tx.rollback();
                throw e;
            }
        });

        return true;
    } catch (e) {
        error("db.insertServer", e);
        debug("db.insertServer", JSON.stringify(value));

        return false;
    }
};

export const insertResults = async (value: {
    ip: string;
    results: SiteResult[];
}): Promise<boolean> => {
    try {
        await db.transaction(async tx => {
            try {
                // Insert tester if not exist
                const testerId = await fetchTesterId();

                // Insert results
                const resultInsert = await tx
                    .insert(schema.resultTable)
                    .values(value.results.map(result => {
                        return {
                            testerId,
                            ip: value.ip,
                            ...result,
                            duration: result.success ? result.duration : -1,
                            timestamp: +new Date()
                        }
                    }));

                assert(resultInsert.rowsAffected === value.results.length, "Expected all results to be inserted");
            } catch (e) {
                tx.rollback();
                throw e;
            }
        });

        return true;
    } catch (e) {
        error("db.insertResults", e);
        log("db.insertResults", JSON.stringify(value));
        return false;
    }
};

const upsertStatisticStatement = db
    .insert(schema.statisticTable)
    .values({
        key: sql.placeholder("key"),
        value: sql.placeholder("value")
    })
    .onConflictDoUpdate({
        target: schema.statisticTable.key,
        set: {
            value: sql`${schema.statisticTable.value} + ${sql.placeholder("value")}`
        }
    })
    .returning()
    .prepare();

export const updateStatistic = async (key: "serverTested", value: number) => {
    try {
        const result = await upsertStatisticStatement.execute({
            key,
            value
        });

        assert(result.length === 1, "Expected 1 row to be inserted into statistic");

        return true;
    } catch (e) {
        error("db.updateStatistic", e);
        return false;
    }
};