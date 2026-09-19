import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "./client.js";
import { loadEnv } from "../utils/env.js";
import { createLogger } from "../utils/logger.js";

const env = loadEnv();
const logger = createLogger(env);
const { db, close } = createDatabase(env.POSTGRES_URL);

await migrate(db, { migrationsFolder: "drizzle" });
await close();

logger.info("Migrations applied.");
