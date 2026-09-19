import type { Command } from "./index.js";

import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { InventoryView } from "../components/inventory.js";
import { buildInventory } from "../interactions/inventory.js";

/**
 * Shows a member's collection.
 */
export const inventory: Command = {
    data: new SlashCommandBuilder()
        .setName("inventory")
        .setDescription("Shows you all the collectibles you've gathered.")
        .setContexts(InteractionContextType.Guild)
        .addUserOption((o) => o.setName("user").setDescription("The user to show the inventory for."))
        .toJSON(),
    execute: async (ctx, interaction) => {
        if (!interaction.inGuild()) {
            return;
        }

        const user = interaction.options.getUser("user") ?? interaction.user;
        await interaction.deferReply();

        const message = await buildInventory(ctx, interaction.guildId, user.id, InventoryView.Overview);
        await interaction.editReply(message);
    }
};
