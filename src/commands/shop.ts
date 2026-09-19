import type { Command } from "./index.js";

import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { buildShop } from "../interactions/shop.js";

/**
 * Opens the candy shop.
 */
export const shop: Command = {
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("Spend your candy on charms and lures.")
        .setContexts(InteractionContextType.Guild)
        .toJSON(),
    execute: async (ctx, interaction) => {
        if (!interaction.inGuild()) {
            return;
        }

        const message = await buildShop(ctx, interaction.guildId, interaction.user.id);
        await interaction.reply({ ...message, flags: message.flags | MessageFlags.Ephemeral });
    }
};
