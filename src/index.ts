import type { Context } from "./context.js";

import { Client, GatewayIntentBits, Options } from "discord.js";
import { createDatabase } from "./database/client.js";
import { createRepositories } from "./database/repositories/index.js";
import { effects } from "./core/effects/index.js";
import { SpawnStore } from "./core/spawner.js";
import { loadEnv } from "./utils/env.js";
import { createLogger } from "./utils/logger.js";
import * as ready from "./events/ready.js";
import * as guildCreate from "./events/guildCreate.js";
import * as messageCreate from "./events/messageCreate.js";
import * as interactionCreate from "./events/interactionCreate.js";

/**
 * Creates the Discord client with minimal caching.
 *
 * @returns The created Discord client.
 */
function createClient(): Client {
    return new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
        makeCache: Options.cacheWithLimits({
            ...Options.DefaultMakeCacheSettings,
            MessageManager: 0,
            ReactionManager: 0,
            PresenceManager: 0
        })
    });
}

const env = loadEnv();
const logger = createLogger(env);
const { db } = createDatabase(env.POSTGRES_URL);
const client = createClient();

const ctx: Context = {
    client: client as Context["client"],
    db: db,
    repositories: createRepositories(db),
    effects: effects,
    spawns: new SpawnStore(),
    logger: logger
};

for (const event of [ready, guildCreate, messageCreate, interactionCreate]) {
    event.register(ctx);
}

process.on("unhandledRejection", (error) => logger.error(error, "Unhandled rejection"));
process.on("uncaughtException", (error) => {
    logger.fatal(error, "Uncaught exception");
    process.exit(1);
});

await client.login(env.DISCORD_TOKEN);
