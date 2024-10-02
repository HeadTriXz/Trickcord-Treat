import { Application, MainModule } from "./main.js";
import { GatewayDispatchEvents, GatewayIntentBits } from "@discordjs/core";
import { Logger } from "@barry-bot/logger";

// Check environment variables.
if (process.env.DISCORD_CLIENT_ID === undefined) {
    throw new Error("Missing environment variable: DISCORD_CLIENT_ID");
}

if (process.env.DISCORD_TOKEN === undefined) {
    throw new Error("Missing environment variable: DISCORD_TOKEN");
}

// Initialize the logger.
const logger = new Logger({
    environment: process.env.NODE_ENV,
    sentry: {
        dsn: process.env.SENTRY_DSN
    }
});

// Initialize the application.
const app = new Application({
    discord: {
        applicationID: process.env.DISCORD_CLIENT_ID,
        intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
        token: process.env.DISCORD_TOKEN
    },
    logger: logger,
    modules: [MainModule]
});

process.on("uncaughtException", (error) => {
    logger.fatal(error);
});

// Initialize the application.
app.on(GatewayDispatchEvents.Ready, ({ user }) => {
    logger.info(`Successfully logged in as ${user.username}#${user.discriminator}`);
});

app.initialize().catch((error) => {
    logger.fatal(error);
});
