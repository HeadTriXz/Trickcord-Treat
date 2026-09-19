import { ContainerBuilder } from "discord.js";
import { ItemRarity } from "../utils/data.js";
import { type Emoji, config } from "../config.js";

/**
 * A Components V2 message payload built from container builders only.
 */
export interface ComponentsV2Payload {
    /**
     * The message's top-level components.
     */
    components: ContainerBuilder[];

    /**
     * The message flags (always includes `IsComponentsV2`).
     */
    flags: number;
}

/**
 * Builds a container with the bot's default accent color.
 *
 * @returns A new, empty container.
 */
export function createContainer(): ContainerBuilder {
    return new ContainerBuilder().setAccentColor(config.colors.default);
}

/**
 * Formats a candy amount.
 *
 * @param amount The amount of candy.
 * @returns The formatted amount, with emoji.
 */
export function formatCandy(amount: number): string {
    return `${config.emojis.candy} **${amount}**`;
}

/**
 * Returns the emoji for a rarity.
 *
 * @param rarity The rarity to format.
 * @returns The rarity's emoji.
 */
export function getRarityEmoji(rarity: ItemRarity): Emoji {
    switch (rarity) {
        case ItemRarity.Common: return config.emojis.common;
        case ItemRarity.Uncommon: return config.emojis.uncommon;
        case ItemRarity.Rare: return config.emojis.rare;
    }
}

/**
 * Returns the human-readable rarity name.
 *
 * @param rarity The rarity to format.
 * @returns The rarity's display name.
 */
export function getRarityName(rarity: ItemRarity): string {
    switch (rarity) {
        case ItemRarity.Common: return "Common";
        case ItemRarity.Uncommon: return "Uncommon";
        case ItemRarity.Rare: return "Rare";
    }
}
