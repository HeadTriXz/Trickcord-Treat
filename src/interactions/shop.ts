import type { Context } from "../context.js";
import type { InteractionHandler } from "./router.js";

import { createShopMessage } from "../components/shop.js";
import { purchase } from "../core/shop.js";
import { createSpawnGate } from "./spawn.js";

/**
 * Loads the shop for a member.
 *
 * @param ctx The bot context.
 * @param guildID The ID of the guild.
 * @param userID The ID of the user.
 * @returns The shop message payload.
 */
export async function buildShop(
    ctx: Context,
    guildID: string,
    userID: string
): Promise<ReturnType<typeof createShopMessage>> {
    const [member, active] = await Promise.all([
        ctx.repositories.members.getOrCreate(guildID, userID),
        ctx.repositories.activeEffects.getActive(guildID, userID)
    ]);

    return createShopMessage({
        balance: member.candy,
        effects: ctx.effects,
        activeTypes: new Set(active.map((e) => e.type))
    });
}

/**
 * Handles Buy buttons.
 */
export const shopHandler: InteractionHandler = {
    scope: "shop",
    execute: async (ctx, interaction, id) => {
        if (!interaction.isButton() || !interaction.inCachedGuild() || id.action !== "buy") {
            return;
        }

        await interaction.deferUpdate();

        await purchase({ db: ctx.db, effects: ctx.effects }, id.args[0]!, {
            guildID: interaction.guildId,
            userID: interaction.user.id,
            channelID: interaction.channelId,
            roleIds: [...interaction.member.roles.cache.keys()],
            spawner: createSpawnGate(ctx)
        });

        const message = await buildShop(ctx, interaction.guildId, interaction.user.id);
        await interaction.editReply(message);
    }
};
