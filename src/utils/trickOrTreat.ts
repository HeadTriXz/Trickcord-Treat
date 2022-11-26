import type { CommandInteraction } from "eris";
import type { Client } from "../structures/Client.js";

import config from "../config.js";
import items from "../items.json" assert { type: "json" };
import monsters from "../monsters.json" assert { type: "json" };

export enum ItemRarity {
    COMMON,
    UNCOMMON,
    RARE
}

/**
 * Returns the footer based on the item's rarity.
 * @param rarity The rarity of the item.
 * @returns The footer text.
 */
function getFooter(rarity: ItemRarity): string {
    switch (rarity) {
        case ItemRarity.COMMON:
            return "There's nothing special about it.";
        case ItemRarity.UNCOMMON:
            return "You wonder where they got it...";
        case ItemRarity.RARE:
            return "You feel special.";
    }
}

/**
 * Returns the string-representation of the rarity.
 * @param rarity The rarity of the item.
 * @returns The string-representation of the rarity.
 */
export function getRarityString(rarity: ItemRarity): string {
    switch (rarity) {
        case ItemRarity.COMMON:
            return "common";
        case ItemRarity.UNCOMMON:
            return "uncommon";
        case ItemRarity.RARE:
            return "rare";
    }
}

/**
 * Handles a user issuing the trick or treat command.
 * @param client The client that has received the interaction.
 * @param interaction The interaction of the command.
 * @param name The name of the command.
 */
export async function trickOrTreat(client: Client, interaction: CommandInteraction, name: "trick" | "treat"): Promise<void> {
    if (!interaction.guildID) {
        return;
    }

    const spawn = client.monsters.get(interaction.guildID);
    if (spawn?.channel_id !== interaction.channel.id) {
        return interaction.createMessage({
            content: `${config.emotes.error} There is no one knockin' on your door.`,
            flags: 1 << 6
        });
    }

    if (spawn.required_cmd !== name) {
        await client.editMessage(spawn.channel_id, spawn.message_id, {
            embeds: [{
                title: "Oh no!",
                description: "You used the wrong command and seemed to scare them off.",
                color: config.defaultColor
            }]
        });

        await interaction.defer();
        return interaction.deleteOriginalMessage();
    }

    const item = items.find((i) => i.id === spawn.item_id)!;
    const monster = monsters.find((m) => m.id === item.parent_id)!;

    client.monsters.delete(interaction.guildID);

    const isDuplicate = await client.inventory.has(interaction.guildID, interaction.user.id, item.id);
    if (!isDuplicate) {
        const oldTop = await client.inventory.getTop(interaction.guildID);
        await client.inventory.add(interaction.guildID, interaction.user.id, item.id);

        if (oldTop[0].count !== items.length) {
            const newTop = await client.inventory.getTop(interaction.guildID);

            if (oldTop[0].user_id !== newTop[0].user_id) {
                const settings = await client.config.getOrCreate(interaction.guildID);
                await client.removeGuildMemberRole(interaction.guildID, oldTop[0].user_id, settings.role_id)
                    .catch(() => void 0);

                await client.addGuildMemberRole(interaction.guildID, interaction.user.id, settings.role_id)
                    .catch(() => void 0);
            }
        }

        const count = await client.inventory.getCount(interaction.guildID, interaction.user.id);
        if (count === items.length) {
            await interaction.createMessage({
                content: `${config.emotes.check} Congratulations! You have collected all items.`,
                flags: 1 << 6
            });
        }
    }

    await client.editMessage(spawn.channel_id, spawn.message_id, {
        embeds: [{
            title: "Happy Halloween!",
            description: `As a thank you for your kindness, they give ${interaction.user.mention} one **${item.name}**`,
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

    if (!interaction.acknowledged) {
        await interaction.defer();
        await interaction.deleteOriginalMessage();
    }
}
