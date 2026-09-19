import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

/**
 * Represents a database handle, either the root connection or a transaction.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * A live database connection and the means to close it.
 */
export interface DatabaseHandle {
    /**
     * Closes the underlying connection.
     */
    close: () => Promise<void>;

    /**
     * The database handle.
     */
    db: PostgresJsDatabase<typeof schema>;
}

/**
 * Creates the Postgres-backed database.
 *
 * @param url The connection URL.
 * @returns The database handle and a function to close the connection.
 */
export function createDatabase(url: string): DatabaseHandle {
    const client = postgres(url);
    return {
        db: drizzle(client, { schema }),
        close: () => client.end()
    };
}
