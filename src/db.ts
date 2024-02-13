import { ASN, PrismaClient, Result, Server, ServerCA, ServerCert, ServerKey } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

import { hostname } from "os";
import assert from "assert-ts";
import { lookup } from "./repo/IPInfo";
import { SiteResult } from "./type/SiteResult";


export class PrismaDatabase {
    private _client: PrismaClient;
    private _testerId!: number;

    constructor(url: string) {
        // @ts-ignore
        this._client = new PrismaClient().$extends(withAccelerate());
    }

    public async fetchTesterId() {
        const testerName = hostname();

        const ip = await fetch("https://api.ipify.org?format=json")
            .then(res => res.json())
            .then(res => res.ip);

        assert(ip !== undefined, "Failed to get ip");

        const ipinfo = await lookup(ip);
        const [lat, lon] = ipinfo.loc.split(",");

        const tester = await this._client.tester.upsert({
            where: {
                name: testerName
            },
            update: {
                country: ipinfo.country,
                lat: parseFloat(lat),
                lon: parseFloat(lon)
            },
            create: {
                name: testerName,
                country: ipinfo.country,
                lat: parseFloat(lat),
                lon: parseFloat(lon)
            }
        });

        this._testerId = tester.id;

        return tester.id;
    }

    public async isServerCheckedRecently(ip: string) {
        const result = await this._client.result.findFirst({
            where: {
                ip,
                timestamp: {
                    gt: new Date(Date.now() - 60 * 60 * 1000)
                }
            }
        });

        return result !== null;
    }

    public async upsertASN(asn: ASN) {
        return await this._client.aSN.upsert({
            where: {
                id: asn.id
            },
            update: {
                name: asn.name
            },
            create: asn
        });
    }

    public async upsertServerCA(content: string) {
        return await this._client.serverCA.upsert({
            where: {
                content
            },
            update: {
                content
            },
            create: {
                content
            }
        });
    }

    public async upsertServerCert(content: string) {
        return await this._client.serverCert.upsert({
            where: {
                content
            },
            update: {
                content
            },
            create: {
                content
            }
        });
    }

    public async upsertServerKey(content: string) {
        return await this._client.serverKey.upsert({
            where: {
                content
            },
            update: {
                content
            },
            create: {
                content
            }
        });
    }

    public async upsertServer(server: Server) {
        return await this._client.server.upsert({
            where: {
                ip: server.ip
            },
            update: server,
            create: server
        });
    }

    public async insertResults(ip: string, results: SiteResult[]) {
        if (this._testerId === undefined) {
            this._testerId = await this.fetchTesterId();
        }

        return await this._client.result.createMany({
            data: results.map(result => ({
                ip,
                testerId: this._testerId,
                timestamp: new Date(),
                duration: result.success ? result.duration : -1,
                site: result.site
            }))
        });
    }

    public async updateStatistic(key: "serverTested", value: number) {
        return await this._client.statistic.upsert({
            where: {
                key
            },
            update: {
                value: {
                    increment: value
                }
            },
            create: {
                key,
                value
            }
        });
    }
}