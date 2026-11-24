import { expect, test } from "bun:test";
import { ServerListRequestSchema } from "../src/schemas/ServerListRequest";

test.each([["1", 1], ["20", 20], ["21", 20], ["100", 20]])(
    "server lists cap take=%s at %d results",
    (take, expected) => {
        expect(ServerListRequestSchema.parse({ take }).take).toBe(expected);
    },
);
