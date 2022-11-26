import type {
    Message
} from "eris";
import type { Client } from "../structures/Client.js";

import config from "../config.js";
import items from "../items.json" assert { type: "json" };
import monsters from "../monsters.json" assert { type: "json" };

import { Event } from "../structures/events/Event.js";
import { ItemRarity } from "../utils/trickOrTreat.js";

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
        setInterval(this.checkMonsters.bind(this), 1000);
    }

    /**
     * Checks if the monster has been around for longer than the timeout, and if so, it removes the
     * monster and updates the message.
     */
    async checkMonsters(): Promise<void> {
        for (const [key, value] of this.client.monsters) {
            const settings = await this.client.config.getOrCreate(key);
            if (Date.now() - value.created_at < settings.timeout * 1000) {
                continue;
            }

            this.client.monsters.delete(key);
            await this.client.editMessage(value.channel_id, value.message_id, {
                embeds: [{
                    title: "The trick-or-treater disappeared...",
                    description: "No one noticed them and they left :(",
                    color: config.defaultColor
                }]
            });
        }
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

            const commandName = Math.random() < 0.5 ? "trick" : "treat";
            const command = this.client.commands.find((c) => c.name === commandName);
            if (!command) {
                throw new Error(`Couldn't find a command for "${commandName}"`);
            }

            const commandStr = `</${commandName}:${command.id || 0}>`;
            const msg = await message.channel.createMessage({
                embeds: [{
                    title: "A trick-or-treater has stopped by!",
                    description: "Open the door and greet them with " + commandStr,
                    image: {
                        url: monster.image_url
                    },
                    color: config.defaultColor
                }]
            });

            this.client.monsters.set(message.guildID, {
                channel_id: msg.channel.id,
                item_id: item.id,
                message_id: msg.id,
                required_cmd: commandName,
                created_at: Date.now()
            });
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
