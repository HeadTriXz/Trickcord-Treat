import type { Database } from "../client.js";

import { and, asc, count, countDistinct, desc, eq, max } from "drizzle-orm";
import { inventoryItems } from "../schema.js";

/**
 * Represents a row on the scoreboard.
 */
export interface LeaderboardEntry {
    /**
     * The number of items owned by the user.
     */
    count: number;

    /**
     * The ID of the user.
     */
    userID: string;
}

/**
 * Represents a repository for collected items.
 */
export class InventoryRepository {
    /**
     * The database client.
     */
    #db: Database;

    /**
     * Represents a repository for collected items.
     *
     * @param db The database client.
     */
    constructor(db: Database) {
        this.#db = db;
    }

    /**
     * Adds an item to the user's inventory. The member row must already exist.
     *
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @param itemID The ID of the item.
     */
    async add(guildID: string, userID: string, itemID: number): Promise<void> {
        await this.#db.insert(inventoryItems).values({ guildID, userID, itemID });
    }

    /**
     * Returns the IDs of all items the user owns.
     *
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @returns The item IDs owned by the user.
     */
    async getByUser(guildID: string, userID: string): Promise<number[]> {
        const rows = await this.#db.select({ itemID: inventoryItems.itemID }).from(inventoryItems)
            .where(and(eq(inventoryItems.guildID, guildID), eq(inventoryItems.userID, userID)));

        return rows.map((r) => r.itemID);
    }

    /**
     * Returns one page of the scoreboard and the total number of ranked members.
     *
     * @param guildID The ID of the guild.
     * @param page The page number (0-based).
     * @param size The page size.
     * @returns The leaderboard page and total number of members with at least one item.
     */
    async getLeaderboard(
        guildID: string,
        page: number,
        size: number
    ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
        const [entries, [row]] = await Promise.all([
            this.#getRanked(guildID, size, page * size),
            this.#db.select({ n: countDistinct(inventoryItems.userID) }).from(inventoryItems)
                .where(eq(inventoryItems.guildID, guildID))
        ]);

        const total = row?.n ?? 0;
        return { entries, total };
    }

    /**
     * Returns the member with the most items.
     *
     * @param guildID The ID of the guild.
     * @returns The top member, or undefined if no members have items.
     */
    async getTop(guildID: string): Promise<LeaderboardEntry | undefined> {
        const [row] = await this.#getRanked(guildID, 1, 0);
        return row;
    }

    /**
     * Returns the members ranked by item count, ties broken by who got there first.
     *
     * @param guildID The ID of the guild.
     * @param limit The maximum number of results.
     * @param offset The number of results to skip.
     * @returns The ranked members.
     */
    async #getRanked(guildID: string, limit: number, offset: number): Promise<LeaderboardEntry[]> {
        return this.#db.select({ userID: inventoryItems.userID, count: count() })
            .from(inventoryItems)
            .where(eq(inventoryItems.guildID, guildID))
            .groupBy(inventoryItems.userID)
            .orderBy(desc(count()), asc(max(inventoryItems.createdAt)))
            .limit(limit)
            .offset(offset);
    }
}
