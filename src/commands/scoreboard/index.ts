import { type ApplicationCommandInteraction, SlashCommand } from "@barry-bot/core";
import type { MainModule } from "../../main.js";

import { InteractionContextType } from "@discordjs/core";
import { PaginationMessage } from "../../utils/pagination.js";
import config from "../../config.js";

const SCOREBOARD_PAGE_SIZE = 10;

/**
 * Represents a slash command that shows the scoreboard.
 */
export default class extends SlashCommand<MainModule> {
    /**
     * Represents a slash command that shows the scoreboard.
     *
     * @param module The module the command belongs to.
     */
    constructor(module: MainModule) {
        super(module, {
            name: "scoreboard",
            description: "Shows the users with the most collectibles in the server.",
            contexts: [InteractionContextType.Guild]
        });
    }

    /**
     * Show the scoreboard of the server.
     *
     * @param interaction The interaction that triggered the command.
     */
    async execute(interaction: ApplicationCommandInteraction): Promise<void> {
        if (!interaction.isInvokedInGuild()) {
            return;
        }

        const guild = await this.client.api.guilds.get(interaction.guildID);
        const users = await this.module.inventory.getAllUsers(interaction.guildID);
        if (users.length === 0) {
            return interaction.createMessage({
                embeds: [{
                    title: `🎃 Scoreboard | ${guild.name} 🎃`,
                    description: "No one has collected any items yet.",
                    color: config.defaultColor
                }]
            });
        }
        
        await PaginationMessage.create({
            content: (chunk, i) => ({
                embeds: [{
                    title: `🎃 Scoreboard | ${guild.name} 🎃`,
                    description: chunk.map(({ userID, count }, j) =>
                        `\`${String(j + (i * SCOREBOARD_PAGE_SIZE) + 1).padStart(2, "0")}. \` <@${userID}> — **${count}** item${count === 1 ? "" : "s"} collected.`).join("\n"),
                    color: config.defaultColor
                }]
            }),
            interaction: interaction,
            pageSize: SCOREBOARD_PAGE_SIZE,
            values: users
        });
    }
}
