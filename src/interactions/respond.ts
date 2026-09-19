import type { Context } from "../context.js";

import { type RepliableInteraction, MessageFlags, TextDisplayBuilder } from "discord.js";
import { UserError } from "../utils/errors.js";
import { config } from "../config.js";

/**
 * Sends an ephemeral text message.
 *
 * @param interaction The interaction to reply to.
 * @param content The message content.
 */
export async function replyEphemeral(interaction: RepliableInteraction, content: string): Promise<void> {
    const payload = {
        components: [new TextDisplayBuilder().setContent(content)],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    } as const;

    if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload);
    } else {
        await interaction.reply(payload);
    }
}

/**
 * Runs a handler, turning errors into ephemeral messages.
 *
 * @param ctx The bot context.
 * @param interaction The interaction to reply to on error.
 * @param run The handler to run.
 */
export async function handleErrors(
    ctx: Context,
    interaction: RepliableInteraction,
    run: () => Promise<void>
): Promise<void> {
    try {
        await run();
    } catch (error) {
        if (error instanceof UserError) {
            await replyEphemeral(interaction, `${config.emojis.error} ${error.message}`)
                .catch(() => undefined);
            return;
        }

        ctx.logger.error(error, "Unhandled interaction error");
        await replyEphemeral(interaction, `${config.emojis.error} Something went wrong. Please try again later.`)
            .catch(() => undefined);
    }
}
