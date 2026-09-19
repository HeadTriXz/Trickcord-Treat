import { describe, expect, it } from "vitest";
import { sweetTooth } from "../../../src/core/effects/sweetTooth.js";
import { getItemsForMonster } from "../../../src/utils/data.js";

describe("sweetTooth", () => {
    const candidates = getItemsForMonster(0);
    const pick = sweetTooth.hooks.pickItem!;

    it("does nothing when the user owns none", () => {
        expect(pick(candidates, new Set())).toEqual(candidates);
    });

    it("restricts to unowned items when the user owns some", () => {
        expect(pick(candidates, new Set([0])).map((i) => i.id)).toEqual([1, 2]);
        expect(pick(candidates, new Set([0, 1])).map((i) => i.id)).toEqual([2]);
    });

    it("does nothing when the user owns all", () => {
        expect(pick(candidates, new Set([0, 1, 2]))).toEqual(candidates);
    });

});
