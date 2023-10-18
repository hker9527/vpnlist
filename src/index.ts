import { Router, createCors, createResponse, error, json, text } from "itty-router";
import { SITES, Site } from "./const";
import { buildClient, getClient } from "./drizzle/client";
import { TestResultCache } from "./cache/TestResults";
import { serverTable } from "./drizzle/schema";
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

            if (!isIPv4(ip)) {
                return json({
                    success: false,
                    data: null
                }, {
                    status: 400
                });
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
                return json({
                    success: false,
                    data: null
                }, {
                    status: 404
                });
            }

            return json({
                success: true,
                data
            });
        })
        .get("/api/server/:ip/config", async ({ params }) => {
            const ip = params.ip;

            if (!isIPv4(ip)) {
                return json({
                    success: false,
                    data: null
                }, {
                    status: 400
                });
            }
            
            const db = getClient();

            const data = await db.query.serverTable.findFirst({
                columns: {
                    config: true
                },
                where: eq(serverTable.ip, ip)
            });

            if (!data) {
                return json({
                    success: false,
                    data: null
                }, {
                    status: 404
                });
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
