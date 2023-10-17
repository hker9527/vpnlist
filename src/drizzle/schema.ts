import { relations } from "drizzle-orm";
import { integer, numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const asnNameTable = sqliteTable("asn_name", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique()
});

export const asnTable = sqliteTable("asn", {
    id: text("id").primaryKey(),
    asnNameId: integer("asnNameId").notNull().references(() => asnNameTable.id)
});

export const asnToAsnNameRelations = relations(asnTable, ({ one }) => ({
    asnName: one(asnNameTable, {
        fields: [asnTable.asnNameId],
        references: [asnNameTable.id]
    })
}));

export const serverTable = sqliteTable("server", {
    ip: text("ip").primaryKey(),
    country: text("country").notNull(),
    lat: numeric("lat").notNull(),
    lon: numeric("lon").notNull(),
    speed: numeric("speed").notNull(),
    config: text("config").notNull(),
    asnId: text("asnId").notNull().references(() => asnTable.id)
});

export const serverToIpRelations = relations(serverTable, ({ one }) => ({
    asn: one(asnTable, {
        fields: [serverTable.asnId],
        references: [asnTable.id]
    })
}));

export const testerTable = sqliteTable("tester", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    country: text("location").notNull(),
    lat: numeric("lat").notNull(),
    lon: numeric("lon").notNull()
});

export const resultTable = sqliteTable("result", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    testerId: integer("testerId").notNull().references(() => testerTable.id),
    ip: text("ip").notNull().references(() => serverTable.ip),
    site: text("site").notNull(),
    duration: integer("duration").notNull(),
    timestamp: integer("timestamp").notNull()
});

export const resultToTesterRelations = relations(resultTable, ({ one }) => ({
    tester: one(testerTable, {
        fields: [resultTable.testerId],
        references: [testerTable.id]
    })
}));

export const resultToServerRelations = relations(resultTable, ({ one }) => ({
    server: one(serverTable, {
        fields: [resultTable.ip],
        references: [serverTable.ip]
    })
}));

export const statisticTable = sqliteTable("statistic", {
    key: text("name").primaryKey(),
    value: numeric("value").notNull()
});