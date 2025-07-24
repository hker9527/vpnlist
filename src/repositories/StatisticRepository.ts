import { Repository } from ".";

export class StatisticRepository extends Repository {
    public async getSuccessRatesBySite(site: string): Promise<{ site: string; country: string; success: number; fail: number }[]> {
        const result = await this.client`
            SELECT
                *
            FROM "SuccessRateView"
            WHERE site = ${site}
            GROUP BY site, country
        `;

        return result.map(row => ({
            site: row.site,
            country: row.country,
            success: row.success,
            fail: row.fail
        }));
    }
}