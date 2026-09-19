import { type Effect, EffectType } from "./types.js";

/**
 * Guarantees the next win is not a duplicate, when possible.
 */
export const sweetTooth: Effect = {
    type: EffectType.SweetTooth,
    name: "Sweet Tooth",
    description: "Your next win won't be a duplicate, as long as that trick-or-treater still has something new for you.",
    emoji: "sweetTooth",
    cost: 80,
    stackable: false,
    stored: true,
    consumedOnWin: true,
    hooks: {
        pickItem: (candidates, owned) => {
            const unowned = candidates.filter((item) => !owned.has(item.id));
            if (unowned.length === 0 || unowned.length === candidates.length) {
                return candidates;
            }

            return unowned;
        }
    }
};
