import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase } from "../helpers/database.js";
import { createRepositories } from "../../src/database/repositories/index.js";
import { resolveGreet } from "../../src/core/greet.js";
import { sugarRush } from "../../src/core/effects/sugarRush.js";
import { sweetTooth } from "../../src/core/effects/sweetTooth.js";
import type { Database } from "../../src/database/client.js";

let db: Database;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDatabase()));
afterAll(() => close());

const effects = [sugarRush, sweetTooth];

describe("resolveGreet", () => {
    it("awards a new item and 5 candy", async () => {
        const result = await resolveGreet({ db: db, effects: effects, random: () => 0 }, { guildID: "g", userID: "u1", monsterID: 0 });
        expect(result.item.id).toBe(0); // common item of monster 0
        expect(result).toMatchObject({
            duplicate: false,
            candy: 5,
            balance: 5,
            total: 1,
            collectedAll: false,
            appliedEffects: []
        });
        expect(await createRepositories(db).inventory.getByUser("g", "u1")).toEqual([0]);
    });

    it("gives 10 candy for a duplicate", async () => {
        const result = await resolveGreet({ db: db, effects: effects, random: () => 0 }, { guildID: "g", userID: "u1", monsterID: 0 });
        expect(result).toMatchObject({ duplicate: true, candy: 10, balance: 15, total: 1 });
    });

    it("applies and consumes Sugar Rush", async () => {
        const repositories = createRepositories(db);
        await repositories.activeEffects.create({ guildID: "g", userID: "u2", type: "sugar_rush" });

        // 0.5 → uncommon under 40/35/25, common under 65/25/10.
        const result = await resolveGreet({ db: db, effects: effects, random: () => 0.5 }, { guildID: "g", userID: "u2", monsterID: 1 });
        expect(result.item.rarity).toBe(1);
        expect(result.appliedEffects).toEqual(["sugar_rush"]);
        expect(await repositories.activeEffects.getActive("g", "u2")).toEqual([]);
    });

    it("consumes Sweet Tooth on every win, even when it had nothing to do", async () => {
        const repositories = createRepositories(db);
        await repositories.activeEffects.create({ guildID: "g", userID: "u3", type: "sweet_tooth" });

        const first = await resolveGreet({ db: db, effects: effects, random: () => 0 }, { guildID: "g", userID: "u3", monsterID: 2 });
        expect(first.item.rarity).toBe(0);
        expect(first.appliedEffects).toEqual(["sweet_tooth"]);
        expect(await repositories.activeEffects.getActive("g", "u3")).toEqual([]);
    });

    it("Sweet Tooth steers the roll away from owned items", async () => {
        const repositories = createRepositories(db);
        await resolveGreet({ db: db, effects: effects, random: () => 0 }, { guildID: "g", userID: "u5", monsterID: 3 });
        await repositories.activeEffects.create({ guildID: "g", userID: "u5", type: "sweet_tooth" });

        const second = await resolveGreet({ db: db, effects: effects, random: () => 0 }, { guildID: "g", userID: "u5", monsterID: 3 });
        expect(second.duplicate).toBe(false);
        expect(second.item.rarity).toBe(1); // lowest remaining rarity with random=0
        expect(second.appliedEffects).toEqual(["sweet_tooth"]);
        expect(await repositories.activeEffects.getActive("g", "u5")).toEqual([]);
    });

    it("ignores unknown effect types", async () => {
        const repositories = createRepositories(db);
        await repositories.activeEffects.create({ guildID: "g", userID: "u4", type: "nope" });
        await expect(resolveGreet({ db: db, effects: effects, random: () => 0 }, { guildID: "g", userID: "u4", monsterID: 3 })).resolves.toBeDefined();
    });
});
