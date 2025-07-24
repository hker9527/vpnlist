import postgres from "postgres";

export abstract class Repository {
    protected client: postgres.Sql;
    constructor(url: string) {
        this.client = postgres(url, {
            // debug: (...argvs) => {
            //     console.debug("[SQL]", ...argvs);
            // }
        });
    }
}