import { ItemRarity } from "../utils/data.js";

/**
 * The default rarity weights.
 */
export const DEFAULT_WEIGHTS: RarityWeights = { common: 65, uncommon: 25, rare: 10 };

/**
 * Represents relative weights for each rarity.
 */
export interface RarityWeights {
    /**
     * Weight of the common rarity.
     */
    common: number;

    /**
     * Weight of the rare rarity.
     */
    rare: number;

    /**
     * Weight of the uncommon rarity.
     */
    uncommon: number;
}

/**
 * Returns the weight for a rarity.
 *
 * @param weights The weights to read from.
 * @param rarity The rarity to look up.
 * @returns The rarity's weight.
 */
export function getWeight(weights: RarityWeights, rarity: ItemRarity): number {
    switch (rarity) {
        case ItemRarity.Common: return weights.common;
        case ItemRarity.Uncommon: return weights.uncommon;
        case ItemRarity.Rare: return weights.rare;
    }
}

/**
 * Rolls a rarity among the allowed ones, renormalising the weights.
 *
 * @param weights The weights to use.
 * @param allowed The rarities that may be rolled.
 * @param random A function returning a number in [0, 1).
 * @returns The rolled rarity.
 */
export function rollRarity(
    weights: RarityWeights,
    allowed: readonly ItemRarity[],
    random: () => number = Math.random
): ItemRarity {
    if (allowed.length === 0) {
        throw new Error("Cannot roll a rarity without candidates.");
    }

    const ordered = [...allowed].sort((a, b) => a - b);
    const total = ordered.reduce((sum, r) => sum + getWeight(weights, r), 0);
    let cursor = random() * total;

    for (const rarity of ordered) {
        cursor -= getWeight(weights, rarity);
        if (cursor < 0) {
            return rarity;
        }
    }

    return ordered[ordered.length - 1]!;
}
