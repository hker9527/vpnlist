import { Repository } from ".";

export class ResultRepository extends Repository {
    public async getResultsBySites(
        sites: string[],
        take = 20,
        orderBy: "timestamp" | "duration" | "speed" = "timestamp"
    ) {
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
                        GROUP BY ip, country
                        ORDER BY ${orderBy} ${orderBy === "duration" ? this.client`ASC` : this.client`DESC`}
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
                        WHERE site = ${sites[0]}
                        GROUP BY ip, country
                        ORDER BY ${orderBy} ${orderBy === "duration" ? this.client`ASC` : this.client`DESC`}
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
                        WHERE site IN ${ this.client(sites) }
                        GROUP BY ip, country
                        HAVING COUNT(DISTINCT site) = ${sites.length}
                        ORDER BY ${orderBy} ${orderBy === "duration" ? this.client`ASC` : this.client`DESC`}
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