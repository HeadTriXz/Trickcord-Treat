import type {
    CommandInteraction,
    ComponentInteractionSelectMenuData,
    Member,
    Message
} from "@projectdysnomia/dysnomia";
import type { Client } from "../../structures/Client.js";

import config from "../../config.js";
import items from "../../items.json" assert { type: "json" };

import { getRarityString, ItemRarity } from "../../utils/trickOrTreat.js";
import { resolvers } from "../../structures/commands/options.js";
import { Constants } from "@projectdysnomia/dysnomia";
import { SlashCommand } from "../../structures/commands/SlashCommand.js";

const OPTIONS = [
    {
        label: "Common",
        value: "" + ItemRarity.COMMON,
        emoji: {
            id: config.emotes.common.id,
            name: config.emotes.common.name
        }
    },
    {
        label: "Uncommon",
        value: "" + ItemRarity.UNCOMMON,
        emoji: {
            id: config.emotes.uncommon.id,
            name: config.emotes.uncommon.name
        }
    },
    {
        label: "Rare",
        value: "" + ItemRarity.RARE,
        emoji: {
            id: config.emotes.rare.id,
            name: config.emotes.rare.name
        }
    }
];

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "inventory",
            description: "Shows you all the collectibles you've gathered.",
            guildOnly: true,
            options: {
                member: resolvers.member({ description: "The member whose collectibles to show." })
            }
        });
    }

    async execute(interaction: CommandInteraction, options: { member?: Member }): Promise<void> {
        if (!interaction.guildID) {
            return;
        }

        await interaction.acknowledge();

        const member = options.member ?? interaction.member!;
        const inventory = await this.client.inventory.get(interaction.guildID, member.id);

        const content = this.#getContent(member, ItemRarity.COMMON, inventory);
        const message = await interaction.createFollowup(content);

        await this.#awaitResponse(message, member, inventory, interaction.user!.id);
    }

    async #awaitResponse(message: Message, member: Member, inventory: number[], authorID: string): Promise<void> {
        const [response] = await message.awaitInteractions((i) => i.data.custom_id === "rarity" && i.user!.id === authorID, {
            maxMatches: 1,
            time: 900000
        });

        if (!response) {
            return void message.edit({ components: [] }).catch(() => void 0);
        }

        const rarity = Number((response.data as ComponentInteractionSelectMenuData).values[0]);
        const content = this.#getContent(member, rarity, inventory);
        await response.editParent(content);

        return this.#awaitResponse(message, member, inventory, authorID);
    }

    #getContent(member: Member, rarity: ItemRarity, inventory: number[]) {
        const arr = items.filter((i) => inventory.includes(i.id) && i.rarity === rarity);
        let description = `You own ${arr.length} ${getRarityString(rarity)} items!`;
        if (arr.length > 0) {
            description += `\n\n• ${arr.map((i) => i.name).join("\n• ")}`;
        }

        return {
            components: [{
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [{
                    type: Constants.ComponentTypes.STRING_SELECT,
                    custom_id: "rarity",
                    placeholder: "Rarity",
                    options: OPTIONS
                }]
            }],
            embeds: [{
                title: `${this.#getTitle(rarity)} | ${member.username}'s Inventory`,
                thumbnail: {
                    url: member.dynamicAvatarURL(undefined, 512)
                },
                description: description,
                color: config.defaultColor
            }]
        };
    }

    #getTitle(rarity: ItemRarity): string {
        switch (rarity) {
            case ItemRarity.COMMON:
                return config.emotes.common + " Common";
            case ItemRarity.UNCOMMON:
                return config.emotes.uncommon + " Uncommon";
            case ItemRarity.RARE:
                return config.emotes.rare + " Rare";
        }
    }
}
