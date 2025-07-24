import { isIPv4 } from "is-ip";
import { Router, createCors, createResponse, error, json, text } from "itty-router";
import { BETA_PATCH, CURRENT_PATCH, OVPN_TEMPLATE, SITES, Site, VARIANTS, Variant } from "./const";
import { ServerRepository } from "./repositories/ServerRepository";
import { ResultRepository } from "./repositories/ResultRepository";
import { StatisticRepository } from "./repositories/StatisticRepository";
import { OVPNBuilder } from "./services/OVPNBuilder";

export interface Env {
    DIRECT_URL: string;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
interface BigInt {
    /** Convert to BigInt to string form in JSON.stringify */
    toJSON: () => string;
}
(BigInt.prototype as any).toJSON = function () {
    return this.toString()
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

const buildRouter = () => {
    const router = Router();

    return router
        .all("*", preflight)
        .get("/api/server", async ({ query }) => {
            // Newer version of getting a list of profiles.
            // Query list:
            // - sites[]: Site[] (optional)
            // - take: number
            // - orderBy: "timestamp" | "duration" | "speed"
            const { sites, take, orderBy } = query;
            const _sites = typeof sites === "string" ? [sites] : sites;

            if (_sites?.some(site => !SITES.includes(site as Site))) {
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

            return goodJson(await resultRepository.getResultsBySites(
                _sites ?? [],
                Math.min(Math.max(Number(take) || 20, 1), 50),
                orderBy as "timestamp" | "duration" | "speed" || "timestamp"
            ));
        })
        .get("/api/server/:ip", async ({ params }) => {
            const ip = params.ip;

            if (!isIPv4(ip)) {
                return badJson(400);
            }

            const data = await serverRepository.getServerByIp(ip);

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
                || typeof variant === "string" && !VARIANTS.includes(variant as Variant)
                || !["string", "undefined"].includes(typeof split)
            ) {
                return badJson(400);
            }

            const data = await serverRepository.getServerConfigByIp(ip);

            if (!data) {
                return badJson(404);
            }

            const { filename, content } = new OVPNBuilder()
                .setTime(new Date().toISOString())
                .setProto(data.proto)
                .setIp(data.ip)
                .setPort(data.port)
                .setCa(data.ca)
                .setCert(data.cert)
                .setKey(data.key)
                .build(variant as Variant, split as string);

            return createResponse("application/x-openvpn-profile")(content, {
                headers: {
                    "Content-Disposition": `attachment; filename="${filename}"`,
                    "Cache-Control": "public, max-age=86400"
                }
            });
        })
        .get("/api/stat/:site/countries", async ({ params }) => {
            const site = params.site as Site;

            if (!(SITES.includes(site))) {
                return badJson(400);
            }

            const data = await statisticRepository.getSuccessRatesBySite(site);

            if (!data) {
                return badJson(404);
            }

            return goodJson(data);
        })
        .all("*", () => {
            return text("OwO?", {
                status: 404
            });
        });
}

let serverRepository!: ServerRepository;
let resultRepository!: ResultRepository;
let statisticRepository!: StatisticRepository;

export default {
    fetch: async (request: Request, env: Env) => {
        serverRepository = new ServerRepository(env.DIRECT_URL);
        resultRepository = new ResultRepository(env.DIRECT_URL);
        statisticRepository = new StatisticRepository(env.DIRECT_URL);

        return buildRouter()
            .handle(request)
            .catch(error)
            .then(corsify);
    }
};
