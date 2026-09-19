import { type Effect, EffectType } from "./types.js";

/**
 * Boosts the rarity odds of the next win.
 */
export const sugarRush: Effect = {
    type: EffectType.SugarRush,
    name: "Sugar Rush",
    description: "Better odds of a rarer item on your next win.",
    emoji: "sugarRush",
    cost: 50,
    stackable: false,
    stored: true,
    consumedOnWin: true,
    hooks: {
        rarityWeights: () => ({ common: 40, uncommon: 35, rare: 25 })
    }
};
