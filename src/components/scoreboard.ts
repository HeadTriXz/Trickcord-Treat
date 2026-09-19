import type { LeaderboardEntry } from "../database/repositories/index.js";
import type { ComponentsV2Payload } from "./common.js";

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder
} from "discord.js";
import { createContainer } from "./common.js";
import { buildId } from "../utils/customId.js";
import { config } from "../config.js";

/**
 * Entries per scoreboard page.
 */
export const SCOREBOARD_PAGE_SIZE = 10;

/**
 * Represents the current champion, shown at the top of every page.
 */
export interface ScoreboardChampion {
    /**
     * The champion's avatar URL.
     */
    avatarURL: string;

    /**
     * The number of items the champion owns.
     */
    count: number;

    /**
     * The champion's user ID.
     */
    userID: string;
}

/**
 * Represents the parameters for {@link createScoreboardMessage}.
 */
export interface ScoreboardMessageInput {
    /**
     * The current champion, if any.
     */
    champion: ScoreboardChampion | undefined;

    /**
     * The entries on this page.
     */
    entries: LeaderboardEntry[];

    /**
     * The guild's name.
     */
    guildName: string;

    /**
     * The page number (0-based).
     */
    page: number;

    /**
     * The total number of ranked members.
     */
    total: number;
}

/**
 * Builds the scoreboard message.
 *
 * @param input The data needed to render the scoreboard.
 * @returns The message payload.
 */
export function createScoreboardMessage(input: ScoreboardMessageInput): ComponentsV2Payload {
    const pages = Math.max(1, Math.ceil(input.total / SCOREBOARD_PAGE_SIZE));
    const container = createContainer()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🎃 Scoreboard · ${input.guildName}`))
        .addSeparatorComponents(new SeparatorBuilder());

    if (input.champion !== undefined) {
        container.addSectionComponents(new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${config.emojis.crown} **Champion of Halloween**\n<@${input.champion.userID}> · ${plural(input.champion.count)}`
            ))
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(input.champion.avatarURL)));
        container.addSeparatorComponents(new SeparatorBuilder());
    }

    const lines = input.entries.flatMap((entry, i) => {
        if (entry.userID === input.champion?.userID) {
            return [];
        }

        const rank = String(input.page * SCOREBOARD_PAGE_SIZE + i + 1).padStart(2, "0");
        return [`\`${rank}.\` <@${entry.userID}> · ${plural(entry.count)}`];
    });

    container
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.length > 0 ? lines.join("\n") : "No one has collected any items yet."))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Page ${input.page + 1} of ${pages}`))
        .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(buildId("scoreboard", "page", input.page - 1))
                .setEmoji(config.emojis.previous.toComponent())
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(input.page <= 0),
            new ButtonBuilder()
                .setCustomId(buildId("scoreboard", "page", input.page + 1))
                .setEmoji(config.emojis.next.toComponent())
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(input.page >= pages - 1)
        ));

    return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

/**
 * Formats an item count with the correct singular/plural suffix.
 */
function plural(count: number): string {
    return `**${count}** item${count === 1 ? "" : "s"}`;
}
