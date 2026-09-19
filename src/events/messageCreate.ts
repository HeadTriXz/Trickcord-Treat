import type { Context } from "../context.js";

import { type Message, Events } from "discord.js";
import { getSpawnBlock, rollSpawn } from "../core/spawner.js";
import { postSpawn } from "../interactions/spawn.js";
import { UserError } from "../utils/errors.js";

/**
 * Decides whether a message summons a trick-or-treater.
 *
 * @param ctx The bot context.
 * @param message The message that was sent.
 */
export async function onMessage(ctx: Context, message: Message): Promise<void> {
    if (!message.inGuild() || message.author.bot) {
        return;
    }

    const settings = await ctx.repositories.settings.getOrCreate(message.guildId);
    const block = getSpawnBlock(
        ctx.spawns,
        settings,
        message.guildId,
        message.channelId,
        [...(message.member?.roles.cache.keys() ?? [])]
    );

    if (block !== null || !rollSpawn(settings.chance)) {
        return;
    }

    try {
        await postSpawn(ctx, message.guildId, message.channelId);
    } catch (error) {
        if (!(error instanceof UserError)) {
            throw error;
        }

        ctx.logger.warn({ guildID: message.guildId, channelID: message.channelId }, error.message);
    }
}

/**
 * Registers the listener.
 *
 * @param ctx The bot context.
 */
export function register(ctx: Context): void {
    ctx.client.on(Events.MessageCreate, (message) => {
        onMessage(ctx, message).catch((error: unknown) => ctx.logger.error(error, "messageCreate failed"));
    });
}
