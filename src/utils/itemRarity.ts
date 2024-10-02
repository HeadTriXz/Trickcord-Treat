import config from "../config.js";

/**
 * Represents the rarity of an item.
 */
export enum ItemRarity {
    Common,
    Uncommon,
    Rare
}

/**
 * Returns the footer based on the item's rarity.
 *
 * @param rarity The rarity of the item.
 * @returns The footer text.
 */
export function getRarityFooter(rarity: ItemRarity): string {
    switch (rarity) {
        case ItemRarity.Common:
            return "There's nothing special about it.";
        case ItemRarity.Uncommon:
            return "You wonder where they got it...";
        case ItemRarity.Rare:
            return "You feel special.";
    }
}

/**
 * Returns the string-representation of the rarity.
 *
 * @param rarity The rarity of the item.
 * @returns The string-representation of the rarity.
 */
export function getRarityString(rarity: ItemRarity): string {
    switch (rarity) {
        case ItemRarity.Common:
            return "common";
        case ItemRarity.Uncommon:
            return "uncommon";
        case ItemRarity.Rare:
            return "rare";
    }
}

/**
 * Returns the title based on the item's rarity.
 *
 * @param rarity The rarity of the item.
 * @returns The title text.
 */
export function getRarityTitle(rarity: ItemRarity): string {
    switch (rarity) {
        case ItemRarity.Common:
            return `${config.emotes.common} Common`;
        case ItemRarity.Uncommon:
            return `${config.emotes.uncommon} Uncommon`;
        case ItemRarity.Rare:
            return `${config.emotes.rare} Rare`;
    }
}
