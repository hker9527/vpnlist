import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export class PrismaDatabase {
    private _client: PrismaClient;

    constructor(url: string) {
        // @ts-ignore
        this._client = new PrismaClient({
            datasources: {
                db: {
                    url
                }
            }
        }).$extends(withAccelerate());
    }

    public async getTestResultsBySite(site: string, orderBy: "timestamp" | "duration" | "speed" = "timestamp") {
        return (await this._client.serverListView.findMany({
            where: {
                site
            },
            orderBy: (() => {
                switch (orderBy) {
                    case "timestamp":
                    case "speed":
                        return {
                            [orderBy]: "desc"
                        };
                    case "duration":
                        return {
                            [orderBy]: "asc"
                        };
                }
            })(),
            take: 10,
            // @ts-ignore
            cacheStrategy: {
                ttl: 60 * 15
            }
        })).map(r => {
            const { id, site, ...x } = r;
            return x;
        });
    }

    public async getServerByIp(ip: string) {
        return this._client.server.findUnique({
            select: {
                country: true,
                lat: true,
                lon: true,
                speed: true,
                asn: true
            },
            where: {
                ip
            },
            // @ts-ignore
            cacheStrategy: {
                ttl: 60 * 60 * 24
            }
        });
    }

    public async getServerConfigByIp(ip: string) {
        return await this._client.server.findUnique({
            where: {
                ip
            },
            include: {
                ca: true,
                cert: true,
                key: true
            },
            // @ts-ignore
            cacheStrategy: {
                ttl: 60 * 60 * 24
            }
        });
    }

    public async getSuccessRatesBySite(site: string) {
        return this._client.successRateView.findMany({
            where: {
                site
            },
            // @ts-ignore
            cacheStrategy: {
                ttl: 60 * 60 * 24
            }
        });
    }
}