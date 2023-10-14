import { Router, createCors, error, json } from "itty-router";
import { SITES, Site } from "./const";
import { buildClient, getClient } from "./drizzle/client";
import { TestResultCache } from "./cache/TestResults";
import { serverTable } from "./drizzle/schema";
import { eq } from "drizzle-orm";

export interface Env {
    LIBSQL_DB_URL: string;
    LIBSQL_DB_AUTH_TOKEN: string;
}

const testResultsBySiteCache: Record<Site, TestResultCache> = {
    "uma": new TestResultCache("uma"),
    "dmm": new TestResultCache("dmm"),
};

const { preflight, corsify } = createCors();

const buildRouter = () => {
    const router = Router();

    return router
        .all("*", preflight)
        .get("/api/site/:site", async ({ params }) => {
            const site = params.site as Site;

            if (!(SITES.includes(site))) {
                return json({
                    success: false,
                    data: null
                }, {
                    status: 400
                });
            }

            return json({
                success: true,
                data: await testResultsBySiteCache[site].get()
            });
        })
        .get("/api/server/:ip", async ({ params }) => {
            const ip = params.ip;

            const db = getClient();

            const data = await db.query.serverTable.findFirst({
                columns: {
                    asnId: false
                },
                where: eq(serverTable.ip, ip)
            });

            if (!data) {
                return error(404);
            }

            return json({
                success: true,
                data
            });
        })
        .all("*", () => {
            return error(404);
        });
}

let router: ReturnType<typeof buildRouter>;

export default {
    fetch: async (request: Request, env: Env) => { 
        buildClient(env.LIBSQL_DB_URL, env.LIBSQL_DB_AUTH_TOKEN);

        if (!router) {
            router = buildRouter();
        }

        return router
            .handle(request)
            .catch(error)
            .then(corsify);
    }
};
