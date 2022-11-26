import type { Repository } from "typeorm";
import type { Client } from "../../structures/Client.js";
import { GuildConfig } from "../entities/GuildConfig.js";

/**
 * Controller for config entities.
 */
export class ConfigController {
    #repository: Repository<GuildConfig>;

    /**
     * Controller for config entities.
     * @param client The client that initialized the controller.
     */
    constructor(public client: Client) {
        this.#repository = client.database.getRepository(GuildConfig);
    }

    /**
     * Create a new config entity.
     * @param guildID The ID of the guild.
     * @returns Returns the new entity.
     */
    async create(guildID: string): Promise<GuildConfig> {
        const entity = this.#repository.create({
            guild_id: guildID
        });

        return this.#repository.save(entity);
    }

    /**
     * Returns the config for a specific guild.
     * @param guildID The ID of the guild.
     */
    async get(guildID: string): Promise<GuildConfig | null> {
        return this.#repository.findOneBy({ guild_id: guildID });
    }

    /**
     * If the config exists, return it, otherwise create it and return it.
     * @param guildID The ID of the guild.
     */
    async getOrCreate(guildID: string): Promise<GuildConfig> {
        return await this.get(guildID) ?? await this.create(guildID);
    }

    /**
     * Saves the config to the database.
     * @param obj The config to save.
     */
    async save(obj: GuildConfig): Promise<GuildConfig> {
        return this.#repository.save(obj);
    }
}
