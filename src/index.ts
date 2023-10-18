import { Router, createCors, createResponse, error, json, text } from "itty-router";
import { SITES, Site } from "./const";
import { buildClient, getClient } from "./drizzle/client";
import { TestResultCache } from "./cache/TestResults";
import { serverTable, testerTable } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import { isIPv4 } from "is-ip";

export interface Env {
    LIBSQL_DB_URL: string;
    LIBSQL_DB_AUTH_TOKEN: string;
}

const testResultsBySiteCache: Record<Site, TestResultCache> = {
    "uma": new TestResultCache("uma"),
    "dmm": new TestResultCache("dmm"),
};

const { preflight, corsify } = createCors();

const badJson = (status = 404) => {
    return json({
        success: false,
        data: null
    }, {
        status
    });
};

const goodJson = <T>(data: T) => {
    return json({
        success: true,
        data
    });
};

const buildRouter = () => {
    const router = Router();

    return router
        .all("*", preflight)
        .get("/api/site/:site", async ({ params }) => {
            const site = params.site as Site;

            if (!(SITES.includes(site))) {
                return badJson(400);
            }

            return goodJson(await testResultsBySiteCache[site].get());
        })
        .get("/api/server/:ip", async ({ params }) => {
            const ip = params.ip;

            if (!isIPv4(ip)) {
                return badJson(400);
            }

            const db = getClient();

            const data = await db.query.serverTable.findFirst({
                columns: {
                    asnId: false,
                    config: false
                },
                where: eq(serverTable.ip, ip)
            });

            if (!data) {
                return badJson(404);
            }

            return goodJson(data);
        })
        .get("/api/server/:ip/config", async ({ params }) => {
            const ip = params.ip;

            if (!isIPv4(ip)) {
                return badJson(400);
            }
            
            const db = getClient();

            const data = await db.query.serverTable.findFirst({
                columns: {
                    ip: true,
                    config: true
                },
                where: eq(serverTable.ip, ip)
            });

            if (!data) {
                return badJson(404);
            }

            const generateFileName = () => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth() + 1;
                const date = now.getDate();
                const hour = now.getHours();
                const minute = now.getMinutes();
                const second = now.getSeconds();

                return `NasuVPN-${year}-${month}-${date}-${hour}-${minute}-${second}-${data.ip}.ovpn`;
            };

            return createResponse("application/x-openvpn-profile")(data.config, {
                headers: {
                    "Content-Disposition": `attachment; filename="${generateFileName()}"`
                }
            });
        }
        )
        .get("/api/tester/:id", async ({ params }) => {
            const id = params.id;

            if (!/^\d+$/.test(id)) {
                return badJson(400);
            }

            const client = getClient();

            const tester = await client.query.testerTable.findFirst({
                where: eq(testerTable.id, parseInt(id))
            });

            if (!tester) {
                return badJson(404);
            }

            return goodJson(tester);
        })
        .all("*", () => {
            return text("OwO?", {
                status: 404
            });
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
