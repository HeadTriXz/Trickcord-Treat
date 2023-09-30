import type {
    CommandInteraction,
    GuildTextableChannel
} from "@projectdysnomia/dysnomia";
import type { Client } from "../../../structures/Client.js";

import config from "../../../config.js";

import { resolvers } from "../../../structures/commands/options.js";
import { Constants } from "@projectdysnomia/dysnomia";
import { SlashCommand } from "../../../structures/commands/SlashCommand.js";

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "enable",
            description: "Allows Trick'cord Treat to post in the channel you selected.",
            guildOnly: true,
            options: {
                channel: resolvers.channel({
                    description: "The channel to allow Trick'cord Treat to post in.",
                    channelTypes: [
                        Constants.ChannelTypes.GUILD_TEXT,
                        Constants.ChannelTypes.GUILD_VOICE
                    ],
                    required: true
                })
            }
        });
    }

    async execute(interaction: CommandInteraction, options: { channel: GuildTextableChannel }): Promise<void> {
        if (!interaction.guildID) {
            return;
        }

        const settings = await this.client.config.getOrCreate(interaction.guildID);
        if (settings.allowed_channels.includes(options.channel.id)) {
            return interaction.createMessage({
                content: `${config.emotes.error} That channel is already enabled.`,
                flags: 1 << 6
            });
        }

        settings.allowed_channels.push(options.channel.id);

        await this.client.config.save(settings);
        await interaction.createMessage({
            content: `${config.emotes.check} Successfully enabled <#${options.channel.id}>.`,
            flags: 1 << 6
        });
    }
}
