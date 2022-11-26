import type { CommandInteraction } from "eris";
import type { Client } from "../../structures/Client.js";

import { SlashCommand } from "../../structures/commands/SlashCommand.js";
import { trickOrTreat } from "../../utils/trickOrTreat.js";

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "trick",
            description: "When someone arrives at your door, trick 'em!",
            guildOnly: true
        });
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        return trickOrTreat(this.client, interaction, "trick");
    }
}
