import {
    type ApplicationCommandInteraction,
    SlashCommand,
    getCreatedAt
} from "@barry-bot/core";
import type { MainModule } from "../../main.js";

import config from "../../config.js";

/**
 * Represents a slash command that shows the latency.
 */
export default class extends SlashCommand<MainModule> {
    /**
     * Represents a slash command that shows the latency.
     *
     * @param module The module the command belongs to.
     */
    constructor(module: MainModule) {
        super(module, {
            name: "ping",
            description: "Shows the latency of the bot."
        });
    }

    /**
     * Execute the "ping" command.
     *
     * @param interaction The interaction that triggered the command.
     */
    async execute(interaction: ApplicationCommandInteraction): Promise<void> {
        await interaction.defer();
        const message = await interaction.getOriginalMessage();

        await interaction.editOriginalMessage({
            content: `${config.emotes.check} Pong! \`${getCreatedAt(message.id) - interaction.createdAt}ms\``
        });
    }
}
