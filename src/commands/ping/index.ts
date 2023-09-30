import type { CommandInteraction } from "@projectdysnomia/dysnomia";
import type { Client } from "../../structures/Client.js";

import { SlashCommand } from "../../structures/commands/SlashCommand.js";
import config from "../../config.js";

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "ping",
            description: "Shows the latency of the bot."
        });
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const now = Date.now();
        await interaction.defer();
        await interaction.editOriginalMessage(`${config.emotes.ping} Pong! \`${Date.now() - now}ms\``);
    }
}
