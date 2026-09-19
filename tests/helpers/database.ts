import type { Database } from "../../src/database/client.js";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../../src/database/schema.js";

/**
 * Creates an in-memory Postgres with all migrations applied.
 */
export async function createTestDatabase(): Promise<{ close: () => Promise<void>; db: Database }> {
    const client = new PGlite();
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: "drizzle" });

    return { db: db, close: () => client.close() };
}
