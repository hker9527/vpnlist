import { Repository } from ".";

export class ServerRepository extends Repository {
    public async getServerByIp(ip: string): Promise<{
        speed: number;
        country: string;
        lat: number;
        lon: number;
        asn: {
            id: string;
            name: string;
        };
    } | null> {
        const result = await this.client`
            SELECT
                speed,
                country,
                lat,
                lon,
                "Server"."asnId" as "asnId",
                "ASN"."name" as "asnName"
            FROM "Server"
            JOIN "ASN" ON "Server"."asnId" = "ASN"."id"
            WHERE ip = ${ip}
        `;

        if (result.length === 0) {
            return null;
        }

        const row = result[0];

        return {
            speed: row.speed,
            country: row.country,
            lat: row.lat,
            lon: row.lon,
            asn: {
                id: row.asnId,
                name: row.asnName
            }
        };
    }

    public async getServerConfigByIp(ip: string): Promise<{
        ip: string;
        port: number;
        proto: string;
        ca: string;
        cert: string;
        key: string;
    } | null> {
        const result = await this.client`
            SELECT
                ip,
                port,
                proto,
                "ServerCA"."content" as ca,
                "ServerCert"."content" as cert,
                "ServerKey"."content" as key
            FROM "Server"
            JOIN "ServerCA" ON "Server"."caId" = "ServerCA"."id"
            JOIN "ServerCert" ON "Server"."certId" = "ServerCert"."id"
            JOIN "ServerKey" ON "Server"."keyId" = "ServerKey"."id"
            WHERE ip = ${ip}
        `;

        if (result.length === 0) {
            return null;
        }

        const row = result[0];

        return {
            ip: row.ip,
            port: row.port,
            proto: row.proto,
            ca: row.ca,
            cert: row.cert,
            key: row.key
        };
    }
}