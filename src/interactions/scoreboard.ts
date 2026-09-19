import type { Context } from "../context.js";
import type { InteractionHandler } from "./router.js";

import { type ScoreboardChampion, SCOREBOARD_PAGE_SIZE, createScoreboardMessage } from "../components/scoreboard.js";

/**
 * Loads one scoreboard page.
 *
 * @param ctx The bot context.
 * @param guildID The ID of the guild.
 * @param guildName The guild's name.
 * @param page The page number (0-based).
 * @returns The scoreboard message payload.
 */
export async function buildScoreboard(
    ctx: Context,
    guildID: string,
    guildName: string,
    page: number
): Promise<ReturnType<typeof createScoreboardMessage>> {
    const { entries, total } = await ctx.repositories.inventory.getLeaderboard(guildID, page, SCOREBOARD_PAGE_SIZE);
    const top = page === 0 && entries.length > 0 ? entries[0] : await ctx.repositories.inventory.getTop(guildID);

    let champion: ScoreboardChampion | undefined;
    if (top !== undefined) {
        const user = await ctx.client.users.fetch(top.userID);
        champion = { userID: top.userID, count: top.count, avatarURL: user.displayAvatarURL({ size: 128 }) };
    }

    return createScoreboardMessage({ guildName, entries, page, total, champion });
}

/**
 * Handles the paging buttons.
 */
export const scoreboardHandler: InteractionHandler = {
    scope: "scoreboard",
    execute: async (ctx, interaction, id) => {
        if (!interaction.isButton() || !interaction.inCachedGuild() || id.action !== "page") {
            return;
        }

        const page = Math.max(0, Number(id.args[0]) || 0);
        const message = await buildScoreboard(ctx, interaction.guildId, interaction.guild.name, page);
        await interaction.update(message);
    }
};
