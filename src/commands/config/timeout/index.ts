import type { CommandInteraction } from "@projectdysnomia/dysnomia";
import type { Client } from "../../../structures/Client.js";

import config from "../../../config.js";

import { resolvers } from "../../../structures/commands/options.js";
import { SlashCommand } from "../../../structures/commands/SlashCommand.js";
import { getDuration, getHumanReadable } from "../../../utils/duration.js";

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "timeout",
            description: "Sets after how long before a monster will leave.",
            guildOnly: true,
            options: {
                time: resolvers.string({
                    description: "The amount of time before the monster leaves (e.g. \"5m\").",
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
        settings.timeout = getDuration(options.time);

        if (settings.timeout < 10) {
            return interaction.createMessage({
                content: `${config.emotes.error} The timeout must be larger than 10 seconds.`,
                flags: 1 << 6
            });
        }

        if (settings.timeout > settings.interval) {
            return interaction.createMessage({
                content: `${config.emotes.error} The timeout must be shorter than the interval.`,
                flags: 1 << 6
            });
        }

        await this.client.config.save(settings);
        await interaction.createMessage({
            content: `${config.emotes.check} Successfully set the timeout to \`${getHumanReadable(settings.timeout)}\`.`,
            flags: 1 << 6
        });
    }
}
