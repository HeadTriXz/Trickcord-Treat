import { InventoryRepository, MembersRepository } from "../../../src/database/repositories/index.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase } from "../../helpers/database.js";
import type { Database } from "../../../src/database/client.js";

let db: Database;
let close: () => Promise<void>;
let inventory: InventoryRepository;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
    ({ db, close } = await createTestDatabase());
    inventory = new InventoryRepository(db);
    const membersRepo = new MembersRepository(db);
    for (const user of ["a", "b", "c"]) {
        await membersRepo.getOrCreate("g", user);
    }
});
afterAll(() => close());

describe("InventoryRepository", () => {
    it("adds and lists", async () => {
        expect(await inventory.getByUser("g", "a")).toEqual([]);
        await inventory.add("g", "a", 1);
        await inventory.add("g", "a", 2);
        expect((await inventory.getByUser("g", "a")).sort()).toEqual([1, 2]);
    });

    it("ranks by count, then by who reached it first", async () => {
        await sleep(5);
        await inventory.add("g", "b", 3);
        await inventory.add("g", "b", 4);
        await inventory.add("g", "c", 5);

        const { entries, total } = await inventory.getLeaderboard("g", 0, 10);
        expect(total).toBe(3);
        expect(entries.map((e) => e.userID)).toEqual(["a", "b", "c"]);
        expect(entries[0]?.count).toBe(2);
        expect(await inventory.getTop("g")).toEqual({ userID: "a", count: 2 });
    });

    it("paginates", async () => {
        const page = await inventory.getLeaderboard("g", 1, 2);
        expect(page.entries.map((e) => e.userID)).toEqual(["c"]);
        expect(page.total).toBe(3);
    });

    it("returns undefined top for empty guilds", async () => {
        expect(await inventory.getTop("empty")).toBeUndefined();
        expect(await inventory.getLeaderboard("empty", 0, 10)).toEqual({ entries: [], total: 0 });
    });
});
