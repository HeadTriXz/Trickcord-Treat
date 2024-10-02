import { type APIGuild, GatewayDispatchEvents } from "@discordjs/core";
import type { MainModule } from "../main.js";

import { Event } from "@barry-bot/core";

/**
 * An event that sets up the configuration for a guild when it is created.
 */
export default class extends Event<MainModule> {
    /**
     * An event that sets up the configuration for a guild when it is created.
     *
     * @param module The module the event belongs to. 
     */
    constructor(module: MainModule) {
        super(module, GatewayDispatchEvents.GuildCreate);
    }

    /**
     * Set up the configuration for the guild.
     *
     * @param guild The guild that was created.
     */
    async execute(guild: APIGuild): Promise<void> {
        const settings = await this.module.settings.getOrCreate(guild.id);
        if (settings.roleID !== null) {
            return;
        }

        try {
            const role = await this.client.api.guilds.createRole(guild.id, {
                name: "Champion of Halloween",
                color: 0xFFA400,
                hoist: true
            });

            await this.module.settings.upsert(guild.id, {
                roleID: role.id
            });
        } catch (error: unknown) {
            this.client.logger.warn("Failed to create role for guild", error);
        }
    }
}
