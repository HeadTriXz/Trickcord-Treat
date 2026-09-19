import type { Database } from "../client.js";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { type ActiveEffect, activeEffects } from "../schema.js";

/**
 * Represents the data needed to store a new effect.
 */
export interface ActiveEffectCreateInput {
    /**
     * The guild the effect applies to.
     */
    guildID: string;

    /**
     * The effect's type.
     */
    type: string;

    /**
     * The member the effect applies to.
     */
    userID: string;
}

/**
 * Represents a repository for purchased effects.
 */
export class ActiveEffectsRepository {
    /**
     * The database client.
     */
    #db: Database;

    /**
     * The function to get the current time.
     */
    #now: () => Date;

    /**
     * Represents a repository for purchased effects.
     *
     * @param db The database client.
     * @param now The function to get the current time (for testing).
     */
    constructor(db: Database, now: () => Date = () => new Date()) {
        this.#db = db;
        this.#now = now;
    }

    /**
     * Marks effects as consumed.
     *
     * @param ids The effect IDs to consume.
     */
    async consume(ids: number[]): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        await this.#db.update(activeEffects).set({ consumedAt: this.#now() }).where(inArray(activeEffects.id, ids));
    }

    /**
     * Stores a new effect.
     *
     * @param entry The effect data.
     * @returns The inserted effect.
     */
    async create(entry: ActiveEffectCreateInput): Promise<ActiveEffect> {
        const [row] = await this.#db.insert(activeEffects)
            .values({
                guildID: entry.guildID,
                userID: entry.userID,
                type: entry.type
            })
            .returning();

        return row!;
    }

    /**
     * Returns unconsumed effects for the member, oldest first.
     *
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @returns The active effects, oldest first.
     */
    async getActive(guildID: string, userID: string): Promise<ActiveEffect[]> {
        return this.#db.select().from(activeEffects)
            .where(and(
                eq(activeEffects.guildID, guildID),
                eq(activeEffects.userID, userID),
                isNull(activeEffects.consumedAt)
            ))
            .orderBy(asc(activeEffects.id));
    }
}
