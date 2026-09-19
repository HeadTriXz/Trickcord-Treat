import type { Command } from "./index.js";

import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { buildScoreboard } from "../interactions/scoreboard.js";

/**
 * Shows who has collected the most items.
 */
export const scoreboard: Command = {
    data: new SlashCommandBuilder()
        .setName("scoreboard")
        .setDescription("Shows the users with the most collectibles in the server.")
        .setContexts(InteractionContextType.Guild)
        .toJSON(),
    execute: async (ctx, interaction) => {
        if (!interaction.inCachedGuild()) {
            return;
        }

        await interaction.deferReply();
        const message = await buildScoreboard(ctx, interaction.guildId, interaction.guild.name, 0);
        await interaction.editReply(message);
    }
};
