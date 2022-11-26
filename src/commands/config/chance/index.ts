import type { CommandInteraction } from "eris";
import type { Client } from "../../../structures/Client.js";

import config from "../../../config.js";

import { resolvers } from "../../../structures/commands/options.js";
import { SlashCommand } from "../../../structures/commands/SlashCommand.js";

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "chance",
            description: "Sets the chance of a monster spawning.",
            guildOnly: true,
            options: {
                chance: resolvers.integer({
                    description: "The chance a monster spawns.",
                    required: true,
                    maximum: 100,
                    minimum: 1
                })
            }
        });
    }

    async execute(interaction: CommandInteraction, options: { chance: number }): Promise<void> {
        if (!interaction.guildID) {
            return;
        }

        const settings = await this.client.config.getOrCreate(interaction.guildID);
        settings.chance = options.chance / 100;

        await this.client.config.save(settings);
        await interaction.createMessage({
            content: `${config.emotes.check} Successfully set the chance to \`${options.chance}%\`.`,
            flags: 1 << 6
        });
    }
}
