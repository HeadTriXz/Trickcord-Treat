import type { Command } from "./index.js";

import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { createConfigMessage } from "../components/config.js";

/**
 * Manages the guild configuration.
 */
export const configCommand: Command = {
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Manage the configuration of the bot for this server.")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .toJSON(),
    execute: async (ctx, interaction) => {
        if (!interaction.inGuild()) {
            return;
        }

        const settings = await ctx.repositories.settings.getOrCreate(interaction.guildId);

        const message = createConfigMessage(settings);
        await interaction.reply({ ...message, flags: message.flags | MessageFlags.Ephemeral });
    }
};
