import type { Context } from "../context.js";

import { Events } from "discord.js";
import { commands } from "../commands/index.js";
import { handlers } from "../interactions/index.js";
import { createRouter } from "../interactions/router.js";
import { handleErrors } from "../interactions/respond.js";

/**
 * Dispatches slash commands and component interactions.
 *
 * @param ctx The bot context.
 */
export function register(ctx: Context): void {
    const byName = new Map(commands.map((c) => [c.data.name, c]));
    const route = createRouter(handlers);

    ctx.client.on(Events.InteractionCreate, (interaction) => {
        if (interaction.isChatInputCommand()) {
            const command = byName.get(interaction.commandName);
            if (command === undefined) {
                ctx.logger.warn({ name: interaction.commandName }, "Unknown command");
                return;
            }

            void handleErrors(ctx, interaction, () => command.execute(ctx, interaction));
            return;
        }

        if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
            void handleErrors(ctx, interaction, () => route(ctx, interaction));
        }
    });
}
