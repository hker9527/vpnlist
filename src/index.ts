import { isIPv4 } from "is-ip";
import { Router, createCors, createResponse, error, json, text } from "itty-router";
import { OVPN_TEMPLATE, PATCH, SITES, Site, VARIANTS } from "./const";
import { PrismaDatabase } from "./db";

export interface Env {
    IPINFO_TOKEN: string;
    DATABASE_URL: string;
}

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

const buildRouter = (ipinfoToken: string) => {
    const router = Router();

    return router
        .all("*", preflight)
        .get("/api/site/:site", async ({ params, query }) => {
            const site = params.site as Site;
            const { take, orderBy } = query;

            if (!(SITES.includes(site))) {
                return badJson(400);
            }

            if (typeof take !== "undefined" && isNaN(Number(take))) {
                return badJson(400);
            }

            if (
                typeof orderBy === "object"
                || typeof orderBy === "string" && !["timestamp", "duration", "speed"].includes(orderBy)
            ) {
                return badJson(400);
            }

            return goodJson(await database.getTestResultsBySite(
                site,
                Math.min(Math.max(Number(take) || 20, 1), 50),
                orderBy as "timestamp" | "duration" | "speed" || "timestamp"
            ));
        })
        .get("/api/server/:ip", async ({ params }) => {
            const ip = params.ip;

            if (!isIPv4(ip)) {
                return badJson(400);
            }

            const data = await database.getServerByIp(ip);

            if (!data) {
                return badJson(404);
            }

            return goodJson(data);
        })
        .get("/api/server/:ip/config", async ({ params, query }) => {
            const ip = params.ip;
            const { variant, split } = query;

            if (
                !isIPv4(ip)
                || typeof variant !== "string"
                || typeof variant === "string" && !VARIANTS.includes(variant)
                || !["string", "undefined"].includes(typeof split)
            ) {
                return badJson(400);
            }

            const data = await database.getServerConfigByIp(ip);

            if (!data) {
                return badJson(404);
            }

            const generateDateTimeString = () => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth() + 1;
                const date = now.getDate();
                const hour = now.getHours();
                const minute = now.getMinutes();
                const second = now.getSeconds();

                return `${year}${month.toString().padStart(2, "0")}${date.toString().padStart(2, "0")}-${hour.toString().padStart(2, "0")}${minute.toString().padStart(2, "0")}${second.toString().padStart(2, "0")}`;
            }

            const fileName = `NasuVPN-${generateDateTimeString()}-${ip}-${variant == "current" ? "C" : "L"}${typeof split !== "undefined" ? "S" : "O"}.ovpn`;

            let config = OVPN_TEMPLATE
                .replace("%TIME%", new Date().toISOString())
                .replace("%PROTO%", data.proto)
                .replace("%IP%", data.ip)
                .replace("%PORT%", data.port.toString())
                .replace("%CA%", data.ca.content)
                .replace("%CERT%", data.cert.content)
                .replace("%KEY%", data.key.content);

            if (variant === "legacy") {
                // Comment out line starts with "data-ciphers"
                config = config.replace(/^data-ciphers.+/m, "# $&");
            }

            if (typeof split !== "undefined") {
                config = `${config}${PATCH}`;
            }

            return createResponse("application/x-openvpn-profile")(config, {
                headers: {
                    "Content-Disposition": `attachment; filename="${fileName}"`,
                    "Cache-Control": "public, max-age=86400"
                }
            });
        })
        .get("/api/stat/:site/countries", async ({ params }) => {
            const site = params.site as Site;

            if (!(SITES.includes(site))) {
                return badJson(400);
            }

            const data = await database.getSuccessRatesBySite(site);

            if (!data) {
                return badJson(404);
            }
            
            return goodJson(data);
        })
        // .get("/api/ipinfo", async ({ headers }) => {
        //     const ip = headers.get("CF-Connecting-IP");

        //     if (!ip) {
        //         return badJson(400);
        //     }

        //     // Check referer
        //     const referer = headers.get("Referer");
        //     if (referer !== "https://www.umavpn.pro/") {
        //         return badJson(403);
        //     }

        //     const data = await fetch(`https://ipinfo.io/${ip}?token=${ipinfoToken}`)
        //         .then(res => res.json());

        //     return goodJson(data);
        // })
        .all("*", () => {
            return text("OwO?", {
                status: 404
            });
        });
}

let database!: PrismaDatabase;
let router!: ReturnType<typeof buildRouter>;

export default {
    fetch: async (request: Request, env: Env) => {
        if (!database) {
            database = new PrismaDatabase(env.DATABASE_URL);
        }

        if (!router) {
            router = buildRouter(env.IPINFO_TOKEN);
        }

        return router
            .handle(request)
            .catch(error)
            .then(corsify);
    }
};
