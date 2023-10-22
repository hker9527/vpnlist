import { sql } from "drizzle-orm";
import { Cache } from ".";
import { Site } from "../const";
import { getClient } from "../drizzle/client";

type TestResultBySite = {
    result: {
        id: number;
        duration: number;
        timestamp: number;
    };
    tester: number;
    server: {
        ip: string;
        country: string;
        speed: number;
    };
};

export class TestResultCache extends Cache<TestResultBySite[]> {
    private site: Site;

    public constructor(site: Site, interval?: number) {
        super(interval);
        this.site = site;
    }

    public async update(): Promise<boolean> {
        try {
            const db = getClient();
            const statement = db.all<{
                id: number;
                duration: number;
                timestamp: number;
                testerId: number;
                ip: string;
                country: string;
                speed: number;
            }>(sql`
                SELECT
                    r.id,
                    r.duration,
                    r.timestamp,
                    r.testerId,
                    r.ip,
                    s.country,
                    s.speed
                FROM
                    result r
                JOIN (
                    SELECT
                        ip,
                        MAX(timestamp) AS max_timestamp
                    FROM
                        result r1
                    WHERE
                        r1.duration > 0
                        AND r1.testerId = 3
                        AND r1.site = ${this.site}
                        AND r1.timestamp > ${Date.now() - 1000 * 60 * 60 * 24}
                    GROUP BY ip
                ) AS subquery
                ON r.ip = subquery.ip
                    AND r.site = "uma"
                    AND r.timestamp = subquery.max_timestamp
                JOIN server s ON r.ip = s.ip
                JOIN tester t ON r.testerId = t.id
                ORDER BY r.duration ASC
                LIMIT 10;         
            `);

            this.data = await statement.execute().then((rows) => {
                return rows.map((row) => ({
                    result: {
                        id: row.id,
                        duration: row.duration,
                        timestamp: row.timestamp
                    },
                    tester: row.testerId,
                    server: {
                        ip: row.ip,
                        country: row.country,
                        speed: row.speed
                    }
                }));
            });
            // this.data = await db
            //     .select({
            //         result: {
            //             id: schema.resultTable.id,
            //             duration: schema.resultTable.duration,
            //             timestamp: schema.resultTable.timestamp
            //         },
            //         tester: schema.testerTable.id,
            //         server: {
            //             ip: schema.serverTable.ip,
            //             country: schema.serverTable.country,
            //             speed: schema.serverTable.speed,
            //         }
            //     })
            //     .from(schema.resultTable)
            //     .where(and(
            //         eq(schema.resultTable.site, this.site),
            //         gt(schema.resultTable.duration, 0),
            //         gt(schema.resultTable.timestamp, Date.now() - 1000 * 60 * 60 * 24)
            //     ))
            //     .innerJoin(schema.serverTable, eq(schema.serverTable.ip, schema.resultTable.ip))
            //     .innerJoin(schema.testerTable, eq(schema.testerTable.id, schema.resultTable.testerId))
            //     .orderBy(schema.resultTable.duration)
            //     .groupBy(schema.serverTable.ip)
            //     .limit(50);
            // this.data = db.
            this.updatedAt = +new Date();

            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
};