import type { CommandInteraction } from "@projectdysnomia/dysnomia";
import type { Client } from "../../../structures/Client.js";

import config from "../../../config.js";

import { resolvers } from "../../../structures/commands/options.js";
import { SlashCommand } from "../../../structures/commands/SlashCommand.js";
import { getDuration, getHumanReadable } from "../../../utils/duration.js";

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "interval",
            description: "Sets how often a monster can spawn.",
            guildOnly: true,
            options: {
                time: resolvers.string({
                    description: "How often a monster can spawn (e.g. \"5m\").",
                    required: true
                })
            }
        });
    }

    async execute(interaction: CommandInteraction, options: { time: string }): Promise<void> {
        if (!interaction.guildID) {
            return;
        }

        const settings = await this.client.config.getOrCreate(interaction.guildID);
        settings.interval = getDuration(options.time);

        if (settings.interval < 60) {
            return interaction.createMessage({
                content: `${config.emotes.error} The interval must be larger than 60 seconds.`,
                flags: 1 << 6
            });
        }

        if (settings.interval < settings.timeout) {
            return interaction.createMessage({
                content: `${config.emotes.error} The interval must be larger than the timeout.`,
                flags: 1 << 6
            });
        }

        await this.client.config.save(settings);
        await interaction.createMessage({
            content: `${config.emotes.check} Successfully set the interval to \`${getHumanReadable(settings.interval)}\`.`,
            flags: 1 << 6
        });
    }
}
