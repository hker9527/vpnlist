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

    public async getTestResultsBySite(site: string, take = 20, orderBy: "timestamp" | "duration" | "speed" = "timestamp") {
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
            take,
            // @ts-ignore
            cacheStrategy: {
                ttl: 60 * 15
            }
        })).map(r => {
            const { id, site, ...x } = r;
            return x;
        });
    }

    public async getServers(
        sites: string[],
        take = 20,
        orderBy: "timestamp" | "duration" | "speed" = "timestamp"
    ) {
        const transform = (data: {
            ip: string;
            country: string;
            _min: Record<string, any>
        }[]): {
            ip: string;
            timestamp: string;
            duration: number;
            speed: number;
            country: string;
        } => {
            return data.map(d => {
                const { ip, country, _min } = d;
                return {
                    ip,
                    country,
                    ..._min
                };
            }) as any;
        };

        if (sites.length === 0) {
            return transform(await this._client.serverListView.groupBy({
                by: [
                    "ip",
                    "country",
                    orderBy
                ],
                _min: {
                    timestamp: true,
                    duration: true,
                    speed: true
                },
                orderBy: {
                    [orderBy]: orderBy === "duration" ? "asc" : "desc"
                },
                take,
                // @ts-ignore
                cacheStrategy: {
                    ttl: 60 * 15
                }
            }) as any);
        }

        return transform(await this._client.serverListView.groupBy({
            by: [
                "ip",
                "country",
                orderBy
            ],
            where: {
                site: {
                    in: sites
                }
            },
            _min: {
                timestamp: true,
                duration: true,
                speed: true
            },
            having: {
                ip: {
                    _count: {
                        equals: sites.length
                    }
                }
            },
            orderBy: {
                [orderBy]: orderBy === "duration" ? "asc" : "desc"
            },
            take,
            // @ts-ignore
            cacheStrategy: {
                ttl: 60 * 15
            }
        }) as any);
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