import { REST, Routes } from "discord.js";
import { commands } from "../src/commands/index.js";
import { loadEnv } from "../src/utils/env.js";
import { createLogger } from "../src/utils/logger.js";

const env = loadEnv();
const logger = createLogger(env);
const rest = new REST().setToken(env.DISCORD_TOKEN);

await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: commands.map((c) => c.data) });
logger.info({ count: commands.length }, "Deployed slash commands.");
