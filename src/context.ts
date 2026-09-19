import type { Client } from "discord.js";
import type { Logger } from "pino";
import type { Database } from "./database/client.js";
import type { Repositories } from "./database/repositories/index.js";
import type { Effect } from "./core/effects/types.js";
import type { SpawnStore } from "./core/spawner.js";

/**
 * Represents everything a command or interaction handler needs.
 */
export interface Context {
    /**
     * The logged-in Discord client.
     */
    client: Client<true>;

    /**
     * The database handle.
     */
    db: Database;

    /**
     * All registered effects.
     */
    effects: readonly Effect[];

    /**
     * The application logger.
     */
    logger: Logger;

    /**
     * Repositories bound to the database handle.
     */
    repositories: Repositories;

    /**
     * The in-memory active spawn registry.
     */
    spawns: SpawnStore;
}

/**
 * Represents the database and effects needed to run a purchase or resolve a greet.
 */
export type GameDeps = Pick<Context, "db" | "effects">;
