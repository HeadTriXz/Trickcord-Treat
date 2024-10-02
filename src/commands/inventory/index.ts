import {
    type APIInteractionResponseCallbackData,
    type APIUser,
    ComponentType,
    InteractionContextType
} from "@discordjs/core";
import {
    type ApplicationCommandInteraction,
    ReplyableInteraction,
    SlashCommand,
    SlashCommandOptionBuilder,
    getAvatarURL
} from "@barry-bot/core";
import type { MainModule } from "../../main.js";

import { ItemRarity, getRarityString, getRarityTitle } from "../../utils/index.js";

import config from "../../config.js";
import items from "../../../assets/items.json" with { type: "json" };
import rarities from "./rarities.js";

/**
 * The options for the inventory command. 
 */
interface InventoryOptions {
    /**
     * The user to show the inventory for.
     */
    user: APIUser;
}

/**
 * Represents a slash command that shows the inventory of a user.
 */
export default class extends SlashCommand<MainModule> {
    /**
     * Represents a slash command that shows the inventory of a user.
     *
     * @param module The module the command belongs to.
     */
    constructor(module: MainModule) {
        super(module, {
            name: "inventory",
            description: "Shows you all the collectibles you've gathered.",
            contexts: [InteractionContextType.Guild],
            options: {
                user: SlashCommandOptionBuilder.user({
                    description: "The user to show the inventory for."
                })
            }
        });
    }

    /**
     * Show the inventory of the specified user.
     *
     * @param interaction The interaction that triggered the command.
     */
    async execute(interaction: ApplicationCommandInteraction, options: InventoryOptions): Promise<void> {
        if (!interaction.isInvokedInGuild()) {
            return;
        }

        await interaction.defer();

        const user = options.user ?? interaction.user;
        const inventory = await this.module.inventory.get(interaction.guildID, user.id);

        await interaction.createFollowupMessage(
            this.#getContent(user, ItemRarity.Common, inventory)
        );

        await this.#awaitResponse(interaction, user, inventory);
    }

    /**
     * Awaits the response from the user to show the inventory for a different rarity.
     *
     * @param interaction The interaction that triggered the command.
     * @param user The user to show the inventory for.
     * @param inventory The inventory of the user.
     */
    async #awaitResponse(interaction: ReplyableInteraction, user: APIUser, inventory: number[]): Promise<void> {
        const response = await interaction.awaitMessageComponent({
            customIDs: ["rarity"],
        });

        if (!response?.data.isStringSelect()) {
            await interaction.editOriginalMessage({ components: [] });
            return;
        }

        const rarity = Number(response.data.values[0]);
        const content = this.#getContent(user, rarity, inventory);
        await response.editParent(content);

        return this.#awaitResponse(response, user, inventory);
    }

    /**
     * Returns the message content for the inventory.
     *
     * @param user The user to show the inventory for.
     * @param rarity The rarity to show the inventory for.
     * @param inventory The inventory of the user.
     * @returns The message content for the inventory.
     */
    #getContent(user: APIUser, rarity: ItemRarity, inventory: number[]): APIInteractionResponseCallbackData {
        const filtered = items.filter((i) => inventory.includes(i.id) && i.rarity === rarity);

        let description = `You own ${filtered.length} ${getRarityString(rarity)} items!`;
        if (filtered.length > 0) {
            description += `\n\n• ${filtered.map((i) => i.name).join("\n• ")}`;
        }

        return {
            components: [{
                type: ComponentType.ActionRow,
                components: [{
                    type: ComponentType.StringSelect,
                    custom_id: "rarity",
                    placeholder: "Rarity",
                    options: rarities
                }]
            }],
            embeds: [{
                title: `${getRarityTitle(rarity)} | ${user.global_name}'s Inventory`,
                thumbnail: {
                    url: getAvatarURL(user, { size: 128 })
                },
                description: description,
                color: config.defaultColor
            }]
        };
    }
}
