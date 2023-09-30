import type {
    ActionRow,
    AdvancedMessageContent,
    CommandInteraction,
    ComponentInteraction,
    GuildTextableChannel,
    Message
} from "@projectdysnomia/dysnomia";
import type { Client } from "../../structures/Client.js";

import config from "../../config.js";
import { Constants } from "@projectdysnomia/dysnomia";
import { SlashCommand } from "../../structures/commands/SlashCommand.js";

// CONSTANTS
const INTERACTION_FILTER = (interaction: ComponentInteraction) =>
    interaction.data.custom_id === "next" || interaction.data.custom_id === "previous";

// EMOTES
const NEXT_ID = "1124406938738905098";
const PREVIOUS_ID = "1124406936188768357";
const PAGE_SIZE = 10;

type ContentFunction<T> = (values: T[], page: number) => AdvancedMessageContent | Promise<AdvancedMessageContent>;

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "scoreboard",
            description: "Displays the scores of how your server members are performing.",
            guildOnly: true
        });
    }

    async execute(interaction: CommandInteraction<GuildTextableChannel>): Promise<void> {
        if (!interaction.guildID) {
            return;
        }

        const scoreboard = await this.client.inventory.getTop(interaction.guildID);
        if (scoreboard.length === 0) {
            return interaction.createMessage({
                embeds: [{
                    title: `🎃 Scoreboard | ${interaction.channel.guild.name} 🎃`,
                    description: "No one has collected any items yet.",
                    color: config.defaultColor
                }]
            });
        }

        await interaction.acknowledge();
        await this.#initPage(interaction, scoreboard, PAGE_SIZE, (values, page) => ({
            embeds: [{
                title: `🎃 Scoreboard | ${interaction.channel.guild.name} 🎃`,
                description: values.map(({ user_id, count }, i) =>
                    `\`${String(i + (page * PAGE_SIZE) + 1).padStart(2, "0")}. \` <@${user_id}> — **${count}** item${count === 1 ? "" : "s"} collected.`).join("\n"),
                color: config.defaultColor
            }]
        }));
    }

    /**
     * Waits for navigation updates.
     * @param message The message to wait for interactions for.
     * @param values The values to use for the getContent function.
     * @param page The current page.
     * @param pageSize The amount of items per page.
     * @param getContent The function used to get the content.
     */
    async #awaitUpdate<T>(
        message: Message,
        values: T[],
        page: number,
        pageSize: number,
        getContent: ContentFunction<T>
    ): Promise<void> {
        const [response] = await message.awaitInteractions(INTERACTION_FILTER, {
            maxMatches: 1,
            time: 900000
        });

        if (!response) {
            return void message.edit({ components: [] }).catch(() => void 0);
        }

        await response.acknowledge();
        return this.#handleUpdate(response, values, page, pageSize, response.data.custom_id, getContent);
    }

    /**
     * Creates a paginated message.
     * @param interaction The command interaction.
     * @param values The values to use for the getContent function.
     * @param pageSize The amount of items per page.
     * @param getContent The function used to get the content.
     */
    async #initPage<T>(
        interaction: CommandInteraction | ComponentInteraction,
        values: T[],
        pageSize: number,
        getContent: ContentFunction<T>
    ): Promise<void> {
        const content = await this.#getMessageContent(values, 0, pageSize, getContent);
        const message = await interaction.createFollowup(content);

        if (values.length > pageSize) {
            return this.#awaitUpdate(message, values, 0, pageSize, getContent);
        }
    }

    /**
     * Handles navigation updates.
     * @param interaction The interaction received.
     * @param values The values to use for the getContent function.
     * @param page The current page.
     * @param pageSize The amount of items per page.
     * @param update Whether to go to the next or previous page.
     * @param getContent The function used to get the content.
     */
    async #handleUpdate<T>(
        interaction: ComponentInteraction,
        values: T[],
        page: number,
        pageSize: number,
        update: string,
        getContent: ContentFunction<T>
    ): Promise<void> {
        page += update === "next" ? 1 : -1;

        const content = await this.#getMessageContent(values, page, pageSize, getContent);
        const message = await interaction.editOriginalMessage(content);

        return this.#awaitUpdate(message, values, page, pageSize, getContent);
    }

    /**
     * Returns the navigation buttons based on the current page.
     * @param page The current page.
     * @param lastPage Whether this is the last page.
     */
    #getComponents(page: number, lastPage: boolean): ActionRow[] {
        return [{
            type: Constants.ComponentTypes["ACTION_ROW"],
            components: [
                {
                    type: Constants.ComponentTypes["BUTTON"],
                    style: Constants.ButtonStyles["SECONDARY"],
                    label: "Previous Page",
                    custom_id: "previous",
                    emoji: {
                        id: PREVIOUS_ID,
                        name: "previous"
                    },
                    disabled: page <= 0
                },
                {
                    type: Constants.ComponentTypes["BUTTON"],
                    style: Constants.ButtonStyles["SUCCESS"],
                    label: "Next Page",
                    custom_id: "next",
                    emoji: {
                        id: NEXT_ID,
                        name: "next"
                    },
                    disabled: lastPage
                }
            ]
        }];
    }

    /**
     * Returns the content used for the paginated message.
     * @param values The values to use for the getContent function.
     * @param page The current page.
     * @param pageSize The amount of items per page.
     * @param getContent The function used to get the content.
     */
    async #getMessageContent<T>(
        values: T[],
        page: number,
        pageSize: number,
        getContent: ContentFunction<T>
    ): Promise<AdvancedMessageContent> {
        const chunk = values.slice(page * pageSize, (page + 1) * pageSize);
        const lastPage = Math.ceil(values.length / pageSize) - 1;

        const content = await getContent(chunk, page);
        if (values.length > pageSize) {
            const components = this.#getComponents(page, page >= lastPage);
            if (!content.components) {
                content.components = components;
            } else {
                content.components.push(...components);
            }
        }

        return content;
    }
}
