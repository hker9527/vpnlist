import postgres from "postgres";

export abstract class Repository {
    protected client: postgres.Sql;
    constructor(url: string) {
        if (url === undefined) {
            throw new Error("DATABASE_URL is not defined");
        }

        this.client = postgres(url, {
            // debug: (...argvs) => {
            //     console.debug("[SQL]", ...argvs);
            // }
        });
    }
}