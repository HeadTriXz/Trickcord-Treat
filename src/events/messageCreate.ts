import {
    Constants,
    type Message
} from "@projectdysnomia/dysnomia";
import type { Client } from "../structures/Client.js";

import config from "../config.js";
import items from "../items.json" assert { type: "json" };
import monsters from "../monsters.json" assert { type: "json" };

import { Event } from "../structures/events/Event.js";
import { ItemRarity, getFooter, getRarityString } from "../utils/trickOrTreat.js";

/**
 * The type of response the user gave.
 */
enum OpenDoorType {
    TRICK = "trick",
    TREAT = "treat"
}

/**
 * Handles the messageCreate event.
 */
export default class extends Event {
    /**
     * Handles the messageCreate event.
     * @param client The client that initialized the event.
     */
    constructor(client: Client) {
        super(client, "messageCreate");
    }

    /**
     * Handles the messageCreate event.
     * @param message The message received from the server.
     */
    async execute(message: Message): Promise<void> {
        if (!message.guildID || message.author.bot) {
            return;
        }

        const settings = await this.client.config.getOrCreate(message.guildID);
        if (Math.random() > settings.chance) {
            return;
        }

        if (!settings.allowed_channels.includes(message.channel.id)) {
            return;
        }

        const last = this.client.lastMonsters.get(message.guildID);
        if (!last || Date.now() - last > settings.interval * 1000) {
            this.client.lastMonsters.set(message.guildID, Date.now());

            const item = this.getRandomItem();
            const monster = monsters.find((m) => m.id === item.parent_id);
            if (!monster) {
                throw new Error(`Couldn't find monster with ID "${item.parent_id}"`);
            }

            const requiredType = Math.random() < 0.5 ? OpenDoorType.TRICK : OpenDoorType.TREAT;
            const msg = await message.channel.createMessage({
                components: [{
                    components: [
                        {
                            type: Constants.ComponentTypes.BUTTON,
                            style: Constants.ButtonStyles.SECONDARY,
                            label: "Trick",
                            custom_id: OpenDoorType.TRICK
                        },
                        {
                            type: Constants.ComponentTypes.BUTTON,
                            style: Constants.ButtonStyles.SECONDARY,
                            label: "Treat",
                            custom_id: OpenDoorType.TREAT
                        }
                    ],
                    type: Constants.ComponentTypes.ACTION_ROW
                }],
                embeds: [{
                    title: "A trick-or-treater has stopped by!",
                    description: `Open the door and greet them with \`${requiredType}\``,
                    image: {
                        url: monster.image_url
                    },
                    color: config.defaultColor
                }]
            });

            const [response] = await msg.awaitInteractions((i) => i.user!.id === message.author.id, {
                maxMatches: 1,
                time: settings.timeout * 1000
            });

            if (response === undefined) {
                await this.client.editMessage(message.channel.id, msg.id, {
                    components: [],
                    embeds: [{
                        title: "The trick-or-treater disappeared...",
                        description: "No one noticed them and they left :(",
                        color: config.defaultColor
                    }]
                });

                return;
            }

            if (response.data.custom_id !== requiredType) {
                return response.editParent({
                    components: [],
                    embeds: [{
                        title: "Oh no!",
                        description: "You used the wrong command and seemed to scare them off.",
                        color: config.defaultColor
                    }]
                });
            }

            const isDuplicate = await this.client.inventory.has(message.guildID, message.author.id, item.id);
            await response.editParent({
                components: [],
                embeds: [{
                    title: "Happy Halloween!",
                    description: `As a thank you for your kindness, they give ${response.user!.mention} one **${item.name}**`,
                    image: {
                        url: monster.image_url
                    },
                    footer: {
                        text: isDuplicate
                            ? "You already had this item!"
                            : `This item is ${getRarityString(item.rarity)}. ${getFooter(item.rarity)} It's been added to your inventory`
                    },
                    color: config.defaultColor
                }]
            });

            if (!isDuplicate) {
                const oldTop = await this.client.inventory.getTop(message.guildID);
                await this.client.inventory.add(message.guildID, message.author.id, item.id);

                if (oldTop.length === 0) {
                    await this.client.addGuildMemberRole(message.guildID, message.author.id, settings.role_id)
                        .catch(() => void 0);

                    return;
                }

                if (oldTop[0].count !== items.length) {
                    const newTop = await this.client.inventory.getTop(message.guildID);

                    if (oldTop[0].user_id !== newTop[0].user_id) {
                        await this.client.removeGuildMemberRole(message.guildID, oldTop[0].user_id, settings.role_id)
                            .catch(() => void 0);

                        await this.client.addGuildMemberRole(message.guildID, message.author.id, settings.role_id)
                            .catch(() => void 0);
                    }
                }

                const count = await this.client.inventory.getCount(message.guildID, message.author.id);
                if (count === items.length) {
                    await response.createFollowup({
                        content: `${config.emotes.check} Congratulations! You have collected all items.`,
                        flags: 1 << 6
                    });
                }
            }
        }
    }

    /**
     * @returns A random item.
     */
    getRandomItem() {
        const weights: number[] = [];
        for (let i = 0; i < items.length; i++) {
            weights[i] = this.getRarity(items[i].rarity) + (weights[i - 1] || 0);
        }

        const random = Math.random() * weights[weights.length - 1];
        for (let i = 0; i < weights.length; i++) {
            if (weights[i] > random) {
                return items[i];
            }
        }

        throw new Error("Couldn't get a random item.");
    }

    /**
     * Returns the rarity of an item in percentages.
     * @param rarity The rarity of the item.
     * @returns The percentage of the rarity.
     */
    getRarity(rarity: ItemRarity) {
        switch (rarity) {
            case ItemRarity.COMMON:
                return 0.65;
            case ItemRarity.UNCOMMON:
                return 0.25;
            case ItemRarity.RARE:
                return 0.10;
        }
    }
}
