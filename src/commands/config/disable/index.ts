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
            name: "disable",
            description: "Blocks Trick'cord Treat posting in the channel you selected.",
            guildOnly: true,
            options: {
                channel: resolvers.channel({
                    description: "The channel to block Trick'cord Treat to post in.",
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
        const index = settings.allowed_channels.indexOf(options.channel.id);
        if (index < 0) {
            return interaction.createMessage({
                content: `${config.emotes.error} That channel is already disabled.`,
                flags: 1 << 6
            });
        }

        settings.allowed_channels.splice(index, 1);

        await this.client.config.save(settings);
        await interaction.createMessage({
            content: `${config.emotes.check} Successfully disabled <#${options.channel.id}>.`,
            flags: 1 << 6
        });
    }
}
