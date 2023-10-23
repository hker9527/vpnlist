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
                    AND r.site = ${this.site}
                    AND r.timestamp = subquery.max_timestamp
                JOIN server s ON r.ip = s.ip
                JOIN tester t ON r.testerId = t.id
                ORDER BY r.duration ASC
                LIMIT 50;         
            `);

            this.data = await statement.execute().then((rows) => rows.map((row) => ({
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
            })));
            this.updatedAt = +new Date();

            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
};