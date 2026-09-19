import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase } from "../../helpers/database.js";
import { SettingsRepository } from "../../../src/database/repositories/index.js";
import type { Database } from "../../../src/database/client.js";

let db: Database;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDatabase()));
afterAll(() => close());

describe("SettingsRepository", () => {
    it("serves from cache within the TTL and refetches after", async () => {
        let now = 0;
        const repo = new SettingsRepository(db, { ttlMs: 1000, now: () => now });
        await repo.getOrCreate("g3");

        // Bypass the repository to change the row.
        const other = new SettingsRepository(db);
        await other.update("g3", { timeout: 99 });

        expect((await repo.getOrCreate("g3")).timeout).toBe(60);
        now = 1001;
        expect((await repo.getOrCreate("g3")).timeout).toBe(99);
    });
});
