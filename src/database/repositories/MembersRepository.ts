import type { Database } from "../client.js";

import { and, eq } from "drizzle-orm";
import { type Member, members } from "../schema.js";

/**
 * Represents a repository for members and their candy balance.
 */
export class MembersRepository {
    /**
     * The database client.
     */
    #db: Database;

    /**
     * Represents a repository for members and their candy balance.
     *
     * @param db The database client.
     */
    constructor(db: Database) {
        this.#db = db;
    }

    /**
     * Adds candy to a member. Negative amounts never take the balance below zero.
     *
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @param amount The amount to add (can be negative).
     * @returns The new balance.
     */
    async addCandy(guildID: string, userID: string, amount: number): Promise<number> {
        return this.#db.transaction(async (tx) => {
            const [before] = await tx.insert(members)
                .values({ guildID, userID })
                .onConflictDoUpdate({ target: [members.guildID, members.userID], set: { userID } })
                .returning({ candy: members.candy });

            const balance = Math.max(0, before!.candy + amount);

            await tx.update(members)
                .set({ candy: balance })
                .where(and(eq(members.guildID, guildID), eq(members.userID, userID)));

            return balance;
        });
    }

    /**
     * Returns the member, creating it if needed.
     *
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @returns The member.
     */
    async getOrCreate(guildID: string, userID: string): Promise<Member> {
        const [row] = await this.#db.insert(members)
            .values({ guildID, userID })
            .onConflictDoUpdate({ target: [members.guildID, members.userID], set: { userID } })
            .returning();

        return row!;
    }
}
