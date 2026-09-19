import type { Context } from "../context.js";

import { Events } from "discord.js";

/**
 * Logs when the bot is online.
 *
 * @param ctx The bot context.
 */
export function register(ctx: Context): void {
    ctx.client.once(Events.ClientReady, (client) => {
        ctx.logger.info(`Logged in as ${client.user.tag}`);
    });
}
