import type { Context } from "../context.js";
import type { InteractionHandler } from "./router.js";

import {
    type InventoryUser,
    type InventoryView,
    createInventoryMessage,
    parseInventoryView
} from "../components/inventory.js";

/**
 * Loads everything the inventory message needs.
 *
 * @param ctx The bot context.
 * @param guildID The ID of the guild.
 * @param userID The ID of the user whose inventory is shown.
 * @param view Which part of the collection to show.
 * @returns The inventory message payload.
 */
export async function buildInventory(
    ctx: Context,
    guildID: string,
    userID: string,
    view: InventoryView
): Promise<ReturnType<typeof createInventoryMessage>> {
    const [user, ownedIds, member, activeRows, top] = await Promise.all([
        ctx.client.users.fetch(userID),
        ctx.repositories.inventory.getByUser(guildID, userID),
        ctx.repositories.members.getOrCreate(guildID, userID),
        ctx.repositories.activeEffects.getActive(guildID, userID),
        ctx.repositories.inventory.getTop(guildID)
    ]);

    const activeTypes = new Set(activeRows.map((row) => row.type));
    const inventoryUser: InventoryUser = {
        id: user.id,
        displayName: user.displayName,
        avatarURL: user.displayAvatarURL({ size: 128 })
    };

    return createInventoryMessage({
        user: inventoryUser,
        owned: new Set(ownedIds),
        candy: member.candy,
        view: view,
        activeEffects: ctx.effects.filter((e) => activeTypes.has(e.type)),
        isChampion: top?.userID === userID
    });
}

/**
 * Handles the view select.
 */
export const inventoryHandler: InteractionHandler = {
    scope: "inventory",
    execute: async (ctx, interaction, id) => {
        if (!interaction.isStringSelectMenu() || !interaction.inGuild() || id.action !== "view") {
            return;
        }

        const userID = id.args[0]!;
        const view = parseInventoryView(interaction.values[0]!);
        const message = await buildInventory(ctx, interaction.guildId, userID, view);
        await interaction.update(message);
    }
};
