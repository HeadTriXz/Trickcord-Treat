export enum ItemRarity {
    COMMON,
    UNCOMMON,
    RARE
}

/**
 * Returns the footer based on the item's rarity.
 * @param rarity The rarity of the item.
 * @returns The footer text.
 */
export function getFooter(rarity: ItemRarity): string {
    switch (rarity) {
        case ItemRarity.COMMON:
            return "There's nothing special about it.";
        case ItemRarity.UNCOMMON:
            return "You wonder where they got it...";
        case ItemRarity.RARE:
            return "You feel special.";
    }
}

/**
 * Returns the string-representation of the rarity.
 * @param rarity The rarity of the item.
 * @returns The string-representation of the rarity.
 */
export function getRarityString(rarity: ItemRarity): string {
    switch (rarity) {
        case ItemRarity.COMMON:
            return "common";
        case ItemRarity.UNCOMMON:
            return "uncommon";
        case ItemRarity.RARE:
            return "rare";
    }
}
