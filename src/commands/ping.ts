import type { Command } from "./index.js";

import { MessageFlags, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import { config } from "../config.js";

/**
 * Shows the latency of the bot.
 */
export const ping: Command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Shows the latency of the bot.")
        .toJSON(),
    execute: async (ctx, interaction) => {
        await interaction.deferReply();
        const message = await interaction.fetchReply();
        const latency = message.createdTimestamp - interaction.createdTimestamp;

        await interaction.editReply({
            components: [new TextDisplayBuilder().setContent(`${config.emojis.check} Pong! \`${latency}ms\``)],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
