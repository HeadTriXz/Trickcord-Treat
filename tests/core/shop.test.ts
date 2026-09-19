import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDatabase } from "../helpers/database.js";
import { createRepositories } from "../../src/database/repositories/index.js";
import { effects } from "../../src/core/effects/index.js";
import { purchase } from "../../src/core/shop.js";
import { UserError } from "../../src/utils/errors.js";
import type { Database } from "../../src/database/client.js";
import { EffectType, type PurchaseContext, type SpawnGate } from "../../src/core/effects/types.js";

let db: Database;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDatabase()));
afterAll(() => close());

function ctx(userID: string, spawner: SpawnGate): PurchaseContext {
    return { guildID: "g", userID: userID, channelID: "c", roleIds: [], spawner: spawner };
}

const openGate: SpawnGate = { check: vi.fn().mockResolvedValue(null), spawn: vi.fn().mockResolvedValue(undefined) };

describe("registry", () => {
    it("exposes the three effects", () => {
        expect(effects.map((e) => e.type)).toEqual(["lure", "sugar_rush", "sweet_tooth"]);
        expect(effects.find((e) => e.type === EffectType.Lure)?.stored).toBe(false);
    });
});

describe("purchase", () => {
    it("refuses unknown effects and empty wallets", async () => {
        await expect(purchase({ db, effects }, "nope", ctx("u1", openGate))).rejects.toBeInstanceOf(UserError);
        await expect(purchase({ db, effects }, "sugar_rush", ctx("u1", openGate))).rejects.toThrow(/candy/i);
    });

    it("deducts candy, stores the effect and refuses a second one", async () => {
        const repositories = createRepositories(db);
        await repositories.members.addCandy("g", "u2", 120);

        const result = await purchase({ db, effects }, "sugar_rush", ctx("u2", openGate));
        expect(result.balance).toBe(70);
        expect((await repositories.activeEffects.getActive("g", "u2")).map((e) => e.type)).toEqual(["sugar_rush"]);

        await expect(purchase({ db, effects }, "sugar_rush", ctx("u2", openGate))).rejects.toThrow(/already/i);
    });

    it("lure asks the spawner and spawns without storing", async () => {
        const repositories = createRepositories(db);
        await repositories.members.addCandy("g", "u3", 60);

        const blocked: SpawnGate = { check: vi.fn().mockResolvedValue("cooldown"), spawn: vi.fn() };
        await expect(purchase({ db, effects }, "lure", ctx("u3", blocked))).rejects.toBeInstanceOf(UserError);
        expect(blocked.spawn).not.toHaveBeenCalled();
        expect((await repositories.members.getOrCreate("g", "u3")).candy).toBe(60);

        const result = await purchase({ db, effects }, "lure", ctx("u3", openGate));
        expect(result.balance).toBe(30);
        expect(openGate.spawn).toHaveBeenCalledWith("g", "c");
        expect(await repositories.activeEffects.getActive("g", "u3")).toEqual([]);
    });

    it("refunds the candy when onPurchase fails", async () => {
        const repositories = createRepositories(db);
        await repositories.members.addCandy("g", "u4", 60);

        const failingGate: SpawnGate = { check: vi.fn().mockResolvedValue(null), spawn: vi.fn().mockRejectedValue(new Error("network down")) };
        await expect(purchase({ db, effects }, "lure", ctx("u4", failingGate))).rejects.toThrow(/refunded/i);
        expect((await repositories.members.getOrCreate("g", "u4")).candy).toBe(60);
    });

    it("refunds the candy and surfaces the gate's UserError unchanged when a spawn is already active", async () => {
        const repositories = createRepositories(db);
        await repositories.members.addCandy("g", "u5", 60);

        const busyGate: SpawnGate = {
            check: vi.fn().mockResolvedValue(null),
            spawn: vi.fn().mockRejectedValue(new UserError("There's already someone at the door!"))
        };

        await expect(purchase({ db, effects }, "lure", ctx("u5", busyGate)))
            .rejects.toThrow("There's already someone at the door!");
        expect((await repositories.members.getOrCreate("g", "u5")).candy).toBe(60);
    });
});
