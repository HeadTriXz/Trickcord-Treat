import type { Context } from "../context.js";

import { Events } from "discord.js";

/**
 * Creates default settings when the bot joins a guild.
 *
 * @param ctx The bot context.
 */
export function register(ctx: Context): void {
    ctx.client.on(Events.GuildCreate, (guild) => {
        ctx.repositories.settings.getOrCreate(guild.id)
            .then(() => ctx.logger.info({ guildID: guild.id }, "Joined guild"))
            .catch((error: unknown) => ctx.logger.error(error, "Failed to initialise guild"));
    });
}
