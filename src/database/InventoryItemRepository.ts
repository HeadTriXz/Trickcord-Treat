import type { InventoryItem, PrismaClient } from "@prisma/client";

import items from "../../assets/items.json" with { type: "json" };

/**
 * Represents a user on the leaderboard.
 */
export interface LeaderboardUser {
    /**
     * The ID of the user.
     */
    userID: string;

    /**
     * The amount of collectibles the user has.
     */
    count: number;
}

/**
 * Repository class for managing inventory items.
 */
export class InventoryItemRepository {
    /**
     * The Prisma client used to interact with the database.
     */
    #prisma: PrismaClient;

    /**
     * Repository class for managing inventory items.
     *
     * @param prisma The Prisma client used to interact with the database.
     */
    constructor(prisma: PrismaClient) {
        this.#prisma = prisma;
    }

    /**
     * Add an item to the inventory of the specified user.
     *
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @param itemID The ID of the item.
     * @returns The added inventory item.
     */
    async add(guildID: string, userID: string, itemID: number): Promise<InventoryItem> {
        if (!items.some((item) => item.id === itemID)) {
            throw new Error(`Item with ID ${itemID} does not exist.`);
        }

        return this.#prisma.inventoryItem.create({
            data: {
                guildID,
                userID,
                itemID
            }
        });
    }

    /**
     * Get the amount of items in the inventory of the specified user.
     *
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @returns The amount of items in the inventory.
     */
    async count(guildID: string, userID: string): Promise<number> {
        return this.#prisma.inventoryItem.count({
            where: { guildID, userID }
        });
    }

    /**
     * Get the items in the inventory of the specified user.
     *
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @returns The items in the inventory.
     */
    async get(guildID: string, userID: string): Promise<number[]> {
        const items = await this.#prisma.inventoryItem.findMany({
            select: { itemID: true },
            where: { guildID, userID }
        });

        return items.map((item) => item.itemID);
    }

    /**
     * Get the leaderboard for the specified guild.
     *
     * @param guildID The ID of the guild.
     * @returns The leaderboard.
     */
    async getAllUsers(guildID: string): Promise<LeaderboardUser[]> {
        const raw = await this.#prisma.inventoryItem.groupBy({
            by: ["userID"],
            where: { guildID },
            _count: { itemID: true },
            _max: { createdAt: true },
            orderBy: [
                { _count: { itemID: "desc" } },
                { _max: { createdAt: "asc" } }
            ]
        });

        return raw.map((entry) => ({
            userID: entry.userID,
            count: entry._count.itemID
        }));
    }

    /**
     * Get the user at the top of the leaderboard for the specified guild.
     *
     * @param guildID The ID of the guild.
     */
    async getTopUser(guildID: string): Promise<LeaderboardUser | undefined> {
        const raw = await this.#prisma.inventoryItem.groupBy({
            by: ["userID"],
            where: { guildID },
            _count: { itemID: true },
            _max: { createdAt: true },
            orderBy: [
                { _count: { itemID: "desc" } },
                { _max: { createdAt: "asc" } }
            ],
            take: 1
        });

        if (raw.length > 0) {
            return {
                userID: raw[0].userID,
                count: raw[0]._count.itemID
            };
        }
    }

    /**
     * Check if the specified user has the specified item in their inventory.
     *
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @param itemID The ID of the item.
     * @returns Whether the user has the item.
     */
    async has(guildID: string, userID: string, itemID: number): Promise<boolean> {
        return this.#prisma.inventoryItem.findFirst({
            where: { guildID, userID, itemID }
        }).then((item) => item !== null);
    }
}
