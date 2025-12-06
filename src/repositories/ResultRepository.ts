import { Repository } from ".";
import { type ServerListRequest } from "../schemas/ServerListRequest";

export class ResultRepository extends Repository {
    public async getResultsBySites(argv: ServerListRequest) {
        const { sites = [], take, orderBy, country } = argv;
        
        const result = await (async () => {
            switch (sites.length) {
                case 0:
                    return await this.client`
                        SELECT
                            ip,
                            country,
                            MIN(timestamp) AS timestamp,
                            MIN(duration) AS duration,
                            MIN(speed) AS speed
                        FROM "ServerListView"
                        WHERE 
                            ${country ? this.client`country = ${country}` : this.client`TRUE`}
                        GROUP BY ip, country
                        ORDER BY ${this.client(orderBy)} ${orderBy === "duration" ? this.client`ASC` : this.client`DESC`}
                    `;
                case 1:
                    return await this.client`
                        SELECT
                            ip,
                            country,
                            MIN(timestamp) AS timestamp,
                            MIN(duration) AS duration,
                            MIN(speed) AS speed
                        FROM "ServerListView"
                        WHERE 
                            site = ${sites[0]}
                            AND ${country ? this.client`country = ${country}` : this.client`TRUE`}
                        GROUP BY ip, country
                        ORDER BY ${this.client(orderBy)} ${orderBy === "duration" ? this.client`ASC` : this.client`DESC`}
                    `;
                default:
                    return await this.client`
                        SELECT
                            ip,
                            country,
                            MIN(timestamp) AS timestamp,
                            MIN(duration) AS duration,
                            MIN(speed) AS speed
                        FROM "ServerListView"
                        WHERE
                            site IN ${this.client(sites)}
                            AND ${country ? this.client`country = ${country}` : this.client`TRUE`}
                        GROUP BY ip, country
                        HAVING COUNT(DISTINCT site) = ${sites.length}
                        ORDER BY ${this.client(orderBy)} ${orderBy === "duration" ? this.client`ASC` : this.client`DESC`}
                    `;
            }
        })();

        return result.map(row => ({
            ip: row.ip,
            country: row.country,
            timestamp: row.timestamp.toISOString(),
            duration: row.duration,
            speed: row.speed
        })).slice(0, take);
    }
}