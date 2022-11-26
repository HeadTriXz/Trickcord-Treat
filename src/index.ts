import "./utils/awaitInteractions.js";
import "./utils/dotenv.js";

import { Client } from "./structures/Client.js";

if (!process.env.TOKEN) {
    throw Error("No token given");
}

const client = new Client(process.env.TOKEN, {
    logger: {
        sentry: process.env.SENTRY_URL,
        enableDebug: true
    }
});

client.on("ready", async () => {
    client.logger.info("Client", `Successfully logged in as ${client.user.username}#${client.user.discriminator}`);
});

client.on("error", (error: Error) => {
    client.logger.error("Eris", error);
});

client.connect().catch((error: Error) => {
    client.logger.error("Client", error);
});
