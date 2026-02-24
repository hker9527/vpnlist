import { isIPv4 } from "is-ip";
import { Router, createCors, createResponse, error, json, text } from "itty-router";
import { SITES, Site, VARIANTS, Variant } from "./const";
import { ServerRepository } from "./repositories/ServerRepository";
import { ResultRepository } from "./repositories/ResultRepository";
import { StatisticRepository } from "./repositories/StatisticRepository";
import { OVPNBuilder } from "./services/OVPNBuilder";
import { ServerListRequestSchema } from "./schemas/ServerListRequest";
import { ServerInfoRequestSchema } from "./schemas/ServerInfoRequest";
import { ServerProfileRequestSchema } from "./schemas/ServerProfileRequest";
import { StatisticRequestSchema } from "./schemas/StatisticRequest";

export interface Env {
    DATABASE_URL: string;
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
            let argv;
            try {
                argv = ServerListRequestSchema.parse(query);
            } catch {
                return badJson(400);
            }
            return goodJson(await resultRepository.getResultsBySites(argv));
        })
        .get("/api/server/:ip", async ({ params }) => {
            let argv;
            try {
                argv = ServerInfoRequestSchema.parse(params);
            } catch {
                return badJson(400);
            }

            const data = await serverRepository.getServerByIp(argv.ip);

            if (!data) {
                return badJson(404);
            }

            return goodJson(data);
        })
        .get("/api/server/:ip/config", async ({ params, query }) => {
            let argv;
            try {
                argv = ServerProfileRequestSchema.parse({
                    ip: params.ip,
                    variant: query.variant,
                    split: query.split
                });
            } catch {
                return badJson(400);
            }

            const data = await serverRepository.getServerConfigByIp(argv.ip);

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
                .build(argv.variant, argv.split);

            return createResponse("application/x-openvpn-profile")(content, {
                headers: {
                    "Content-Disposition": `attachment; filename="${filename}"`,
                    "Cache-Control": "public, max-age=86400"
                }
            });
        })
        .get("/api/stat/:site/countries", async ({ params }) => {
            let argv;
            try {
                argv = StatisticRequestSchema.parse(params);
            } catch {
                return badJson(400);
            }

            const data = await statisticRepository.getSuccessRatesBySite(argv.site);

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
        serverRepository = new ServerRepository(env.DATABASE_URL);
        resultRepository = new ResultRepository(env.DATABASE_URL);
        statisticRepository = new StatisticRepository(env.DATABASE_URL);

        return buildRouter()
            .handle(request)
            .catch(error)
            .then(corsify);
    }
};
