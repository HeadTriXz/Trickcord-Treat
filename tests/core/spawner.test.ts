import { describe, expect, it } from "vitest";
import { DoorType, SpawnBlock, SpawnStore, checkSpawn } from "../../src/core/spawner.js";
import { makeSettings } from "../helpers/settings.js";

const settings = makeSettings();

const base = {
    settings: settings,
    channelID: "c",
    roleIds: [] as string[],
    lastSpawnAt: undefined,
    hasActive: false,
    now: 1000000
};

describe("checkSpawn", () => {
    it("allows by default", () => {
        expect(checkSpawn(base)).toBeNull();
    });

    it("blocks channels outside the allow list", () => {
        expect(checkSpawn({ ...base, settings: { ...settings, allowedChannels: ["other"] } })).toBe(SpawnBlock.Channel);
        expect(checkSpawn({ ...base, settings: { ...settings, allowedChannels: ["c"] } })).toBeNull();
    });

    it("blocks ignored channels and roles", () => {
        expect(checkSpawn({ ...base, settings: { ...settings, ignoredChannels: ["c"] } })).toBe(SpawnBlock.Channel);
        expect(checkSpawn({ ...base, roleIds: ["r"], settings: { ...settings, ignoredRoles: ["r"] } })).toBe(SpawnBlock.Role);
    });

    it("blocks during the cooldown and while a spawn is active", () => {
        expect(checkSpawn({ ...base, lastSpawnAt: 1000000 - 299000 })).toBe(SpawnBlock.Cooldown);
        expect(checkSpawn({ ...base, lastSpawnAt: 1000000 - 300000 })).toBeNull();
        expect(checkSpawn({ ...base, hasActive: true })).toBe(SpawnBlock.Active);
    });
});

describe("SpawnStore", () => {
    it("reserves a guild's spawn slot once, then refuses until released", () => {
        const store = new SpawnStore();

        expect(store.isReserved("g")).toBe(false);
        expect(store.reserve("g")).toBe(true);
        expect(store.isReserved("g")).toBe(true);
        expect(store.isBusy("g")).toBe(true);
        expect(store.reserve("g")).toBe(false);

        store.release("g");
        expect(store.isReserved("g")).toBe(false);
        expect(store.isBusy("g")).toBe(false);
        expect(store.reserve("g")).toBe(true);
    });

    it("refuses to reserve while a spawn is active", () => {
        const store = new SpawnStore();
        const timer = setTimeout(() => undefined, 10000);
        store.set("g", { channelID: "c", messageID: "m", monsterID: 1, type: DoorType.Treat, expiresAt: 100, timer: timer });

        expect(store.isBusy("g")).toBe(true);
        expect(store.reserve("g")).toBe(false);
        store.take("g");
        expect(store.isBusy("g")).toBe(false);
        expect(store.reserve("g")).toBe(true);
    });

    it("clears the reservation once the spawn is registered via set", () => {
        const store = new SpawnStore();
        expect(store.reserve("g")).toBe(true);

        const timer = setTimeout(() => undefined, 10000);
        store.set("g", { channelID: "c", messageID: "m", monsterID: 1, type: DoorType.Treat, expiresAt: 100, timer: timer });

        expect(store.isReserved("g")).toBe(false);
        store.take("g");
    });
});
