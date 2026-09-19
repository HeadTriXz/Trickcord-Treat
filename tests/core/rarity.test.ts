import { describe, expect, it } from "vitest";
import { DEFAULT_WEIGHTS, rollRarity } from "../../src/core/rarity.js";
import { ItemRarity } from "../../src/utils/data.js";

const all = [ItemRarity.Common, ItemRarity.Uncommon, ItemRarity.Rare];

describe("rollRarity", () => {
    it("uses default weight boundaries", () => {
        expect(rollRarity(DEFAULT_WEIGHTS, all, () => 0)).toBe(ItemRarity.Common);
        expect(rollRarity(DEFAULT_WEIGHTS, all, () => 0.649)).toBe(ItemRarity.Common);
        expect(rollRarity(DEFAULT_WEIGHTS, all, () => 0.65)).toBe(ItemRarity.Uncommon);
        expect(rollRarity(DEFAULT_WEIGHTS, all, () => 0.899)).toBe(ItemRarity.Uncommon);
        expect(rollRarity(DEFAULT_WEIGHTS, all, () => 0.9)).toBe(ItemRarity.Rare);
        expect(rollRarity(DEFAULT_WEIGHTS, all, () => 0.999)).toBe(ItemRarity.Rare);
    });

    it("renormalises over the allowed subset", () => {
        const allowed = [ItemRarity.Uncommon, ItemRarity.Rare]; // 25 : 10
        expect(rollRarity(DEFAULT_WEIGHTS, allowed, () => 0.7)).toBe(ItemRarity.Uncommon);
        expect(rollRarity(DEFAULT_WEIGHTS, allowed, () => 0.72)).toBe(ItemRarity.Rare);
    });

    it("throws when nothing is allowed", () => {
        expect(() => rollRarity(DEFAULT_WEIGHTS, [], () => 0)).toThrow();
    });
});
