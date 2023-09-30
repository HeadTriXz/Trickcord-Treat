import type { CommandInteraction, GuildTextableChannel } from "@projectdysnomia/dysnomia";
import type { Client } from "../../../structures/Client.js";

import config from "../../../config.js";
import { SlashCommand } from "../../../structures/commands/SlashCommand.js";

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "role",
            description: "If you do not see the Champion of Halloween role, please use this command to regenerate the role.",
            guildOnly: true
        });
    }

    async execute(interaction: CommandInteraction<GuildTextableChannel>): Promise<void> {
        if (!interaction.guildID) {
            return;
        }

        const settings = await this.client.config.getOrCreate(interaction.guildID);
        if (settings.role_id) {
            const roleExists = interaction.channel.guild.roles.has(settings.role_id);
            if (roleExists) {
                return interaction.createMessage({
                    content: `${config.emotes.error} The Champion of Halloween role already exists.`,
                    flags: 1 << 6
                });
            }
        }

        try {
            const role = await this.client.createRole(interaction.guildID, {
                name: "Champion of Halloween",
                color: 0xFFA400,
                hoist: true
            });

            const top = await this.client.inventory.getTop(interaction.guildID);
            await this.client.addGuildMemberRole(interaction.guildID, top[0].user_id, role.id)
                .catch(() => void 0);

            settings.role_id = role.id;
            await this.client.config.save(settings);
            await interaction.createMessage({
                content: `${config.emotes.check} Successfully regenerated the Champion of Halloween role.`,
                flags: 1 << 6
            });
        } catch {
            return interaction.createMessage({
                content: `${config.emotes.error} Something went wrong while regenerating the role.`,
                flags: 1 << 6
            });
        }
    }
}
