import { and, eq, gt } from "drizzle-orm";
import { Cache } from ".";
import { Site } from "../const";
import * as schema from "../drizzle/schema";
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

            this.data = await db
                .select({
                    result: {
                        id: schema.resultTable.id,
                        duration: schema.resultTable.duration,
                        timestamp: schema.resultTable.timestamp
                    },
                    tester: schema.testerTable.id,
                    server: {
                        ip: schema.serverTable.ip,
                        country: schema.serverTable.country,
                        speed: schema.serverTable.speed,
                    }
                })
                .from(schema.resultTable)
                .where(and(
                    eq(schema.resultTable.site, this.site),
                    gt(schema.resultTable.duration, 0),
                    gt(schema.resultTable.timestamp, Date.now() - 1000 * 60 * 60 * 24)
                ))
                .innerJoin(schema.serverTable, eq(schema.serverTable.ip, schema.resultTable.ip))
                .innerJoin(schema.testerTable, eq(schema.testerTable.id, schema.resultTable.testerId))
                .orderBy(schema.resultTable.duration)
                .limit(10);
            this.updatedAt = +new Date();

            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
};