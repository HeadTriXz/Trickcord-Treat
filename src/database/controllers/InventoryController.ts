import type { Repository } from "typeorm";
import type { Client } from "../../structures/Client.js";

import { InventoryItem } from "../entities/InventoryItem.js";

/**
 * Represents an user with the amount of items.
 */
interface TopUser {
    /** The ID of the user. */
    user_id: string;

    /** The amount of items this user has. */
    count: number;
}

/**
 * Controller for inventory items.
 */
export class InventoryController {
    #repository: Repository<InventoryItem>;

    /**
     * Controller for inventory items.
     * @param client The client that initialized the controller.
     */
    constructor(public client: Client) {
        this.#repository = client.database.getRepository(InventoryItem);
    }

    /**
     * Adds a new item to the member's inventory.
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @param itemID The ID of the item.
     * @returns The new item entity.
     */
    async add(guildID: string, userID: string, itemID: number): Promise<InventoryItem> {
        const entity = this.#repository.create({
            guild_id: guildID,
            user_id: userID,
            item_id: itemID
        });

        return this.#repository.save(entity);
    }

    /**
     * Returns all items of a member.
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @returns An array with the IDs of the items.
     */
    async get(guildID: string, userID: string): Promise<number[]> {
        const raw = await this.#repository.createQueryBuilder()
            .select("item_id", "id")
            .where("guild_id = :guildID", { guildID })
            .andWhere("user_id = :userID", { userID })
            .getRawMany();

        return raw.map((x) => x.id);
    }

    /**
     * Returns the amount of items the member has.
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @returns The amount of items.
     */
    async getCount(guildID: string, userID: string): Promise<number> {
        return this.#repository.countBy({
            guild_id: guildID,
            user_id: userID
        });
    }

    /**
     * Returns all members sorted by their item count.
     * @param guildID The ID of the guild.
     * @returns A sorted array of inventories.
     */
    async getTop(guildID: string): Promise<TopUser[]> {
        const raw = await this.#repository.createQueryBuilder()
            .select("COUNT(item_id), MAX(created_at), user_id")
            .where("guild_id = :guildID", { guildID })
            .orderBy({
                count: "DESC",
                max: "ASC"
            })
            .groupBy("user_id")
            .getRawMany();

        return raw;
    }

    /**
     * Returns whether the member already has the item.
     * @param guildID The ID of the guild.
     * @param userID The ID of the user.
     * @param itemID The ID of the item.
     * @returns Whether the member already has the item.
     */
    async has(guildID: string, userID: string, itemID: number): Promise<boolean> {
        const entity = await this.#repository.findOneBy({
            guild_id: guildID,
            user_id: userID,
            item_id: itemID
        });

        return !!entity;
    }
}
