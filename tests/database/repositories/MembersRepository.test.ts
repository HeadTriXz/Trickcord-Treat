import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase } from "../../helpers/database.js";
import { MembersRepository } from "../../../src/database/repositories/index.js";
import type { Database } from "../../../src/database/client.js";

let db: Database;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDatabase()));
afterAll(() => close());

describe("MembersRepository", () => {
    it("adds candy and returns the running balance", async () => {
        const repo = new MembersRepository(db);
        expect(await repo.addCandy("g1", "u2", 5)).toBe(5);
        expect(await repo.addCandy("g1", "u2", 10)).toBe(15);
        expect((await repo.getOrCreate("g1", "u2")).candy).toBe(15);
    });

    it("floors the balance at zero", async () => {
        const repo = new MembersRepository(db);
        await repo.addCandy("g1", "u3", 2);
        expect(await repo.addCandy("g1", "u3", -3)).toBe(0);
        expect((await repo.getOrCreate("g1", "u3")).candy).toBe(0);
    });

});
