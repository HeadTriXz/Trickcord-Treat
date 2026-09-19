import { sql } from "drizzle-orm";
import { bigserial, foreignKey, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Represents the settings of a guild.
 */
export const guildSettings = pgTable("guild_settings", {
    guildID: text("guild_id").primaryKey(),
    chance: integer("chance").notNull().default(20),
    interval: integer("interval").notNull().default(300),
    timeout: integer("timeout").notNull().default(60),
    roleID: text("role_id"),
    allowedChannels: text("allowed_channels").array().notNull().default(sql`'{}'::text[]`),
    ignoredChannels: text("ignored_channels").array().notNull().default(sql`'{}'::text[]`),
    ignoredRoles: text("ignored_roles").array().notNull().default(sql`'{}'::text[]`)
});

/**
 * A guild member's candy balance, keyed by guild and user.
 */
export const members = pgTable("members", {
    guildID: text("guild_id").notNull(),
    userID: text("user_id").notNull(),
    candy: integer("candy").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.guildID, t.userID] })
]);

/**
 * An item owned by a member, referencing the member's `(guildID, userID)` pair.
 */
export const inventoryItems = pgTable("inventory_items", {
    guildID: text("guild_id").notNull(),
    userID: text("user_id").notNull(),
    itemID: integer("item_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.guildID, t.userID, t.itemID] }),
    foreignKey({ columns: [t.guildID, t.userID], foreignColumns: [members.guildID, members.userID] })
]);

/**
 * Represents an effect that is active for a member.
 */
export const activeEffects = pgTable("active_effects", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    guildID: text("guild_id").notNull(),
    userID: text("user_id").notNull(),
    type: text("type").notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    index("active_effects_lookup_idx").on(t.guildID, t.userID, t.type).where(sql`consumed_at IS NULL`)
]);

/**
 * Represents a row of {@link guildSettings}.
 */
export type GuildSettings = typeof guildSettings.$inferSelect;

/**
 * Represents a row of {@link members}.
 */
export type Member = typeof members.$inferSelect;

/**
 * Represents a row of {@link inventoryItems}.
 */
export type InventoryItem = typeof inventoryItems.$inferSelect;

/**
 * Represents a row of {@link activeEffects}.
 */
export type ActiveEffect = typeof activeEffects.$inferSelect;
