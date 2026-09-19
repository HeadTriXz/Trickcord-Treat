import { type Effect, EffectType } from "./types.js";
import { formatSpawnBlock } from "../spawner.js";

/**
 * Summons a trick-or-treater to the current channel.
 */
export const lure: Effect = {
    type: EffectType.Lure,
    name: "Lure",
    description: "Summon a trick-or-treater to this channel right now.",
    emoji: "lure",
    cost: 30,
    stackable: true,
    stored: false,
    consumedOnWin: false,
    hooks: {
        canPurchase: async (ctx) => {
            const block = await ctx.spawner.check(ctx.guildID, ctx.channelID, ctx.roleIds);
            return block === null
                ? null
                : formatSpawnBlock(block);
        },
        onPurchase: (ctx) => ctx.spawner.spawn(ctx.guildID, ctx.channelID)
    }
};
