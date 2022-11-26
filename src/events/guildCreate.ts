import type { Guild } from "eris";
import type { Client } from "../structures/Client.js";

import { Event } from "../structures/events/Event.js";

/**
 * Handles the guildCreate event.
 */
export default class extends Event {
    /**
     * Handles the guildCreate event.
     * @param client The client that initialized the event.
     */
    constructor(client: Client) {
        super(client, "guildCreate");
    }

    /**
     * Handles the guildCreate event.
     * @param guild The guild the event is for.
     */
    async execute(guild: Guild): Promise<void> {
        const settings = await this.client.config.getOrCreate(guild.id);
        if (settings.role_id) {
            return;
        }

        try {
            const role = await guild.createRole({
                name: "Champion of Halloween",
                color: 0xFFA400,
                hoist: true
            });

            settings.role_id = role.id;
            await this.client.config.save(settings);
        } catch {
            // empty
        }
    }
}
