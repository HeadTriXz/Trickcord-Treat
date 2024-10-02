import type { MainModule } from "../main.js";
import type { OpenDoorType } from "../common.js";
import type { ReplyableInteraction } from "@barry-bot/core";

import { getRarityFooter, getRarityString, ItemRarity } from "./index.js";
import { MessageFlags } from "@discordjs/core";

import config from "../config.js";
import items from "../../assets/items.json" with { type: "json" };

/**
 * Represents the probabilities for each rarity.
 */
const RARITY_CHANCE = {
    [ItemRarity.Common]: 0.65,
    [ItemRarity.Uncommon]: 0.25,
    [ItemRarity.Rare]: 0.10
};

/**
 * Get a random item rarity.
 *
 * @returns An item rarity.
 */
function getRandomRarity(): ItemRarity {
    const random = Math.random();

    if (random < RARITY_CHANCE[ItemRarity.Common]) {
        return ItemRarity.Common;
    } else if (random < RARITY_CHANCE[ItemRarity.Common] + RARITY_CHANCE[ItemRarity.Uncommon]) {
        return ItemRarity.Uncommon;
    }

    return ItemRarity.Rare;
}

/**
 * Handles the trick or treat interaction with monsters.
 *
 * @param module The module the command belongs to.
 * @param interaction The interaction that triggered the command.
 * @param type The type of response the user gave.
 */
export async function trickTreat(
    module: MainModule,
    interaction: ReplyableInteraction,
    type: OpenDoorType
): Promise<void> {
    if (!interaction.isInvokedInGuild()) {
        return;
    }

    const spawn = module.currentMonsters.get(interaction.guildID);
    if (spawn === undefined || spawn.channelID !== interaction.channel?.id) {
        return interaction.createMessage({
            content: `${config.emotes.error} There is no one knockin' on your door.`,
            flags: MessageFlags.Ephemeral
        });
    }
 
    module.currentMonsters.delete(interaction.guildID);

    await interaction.defer();
    await interaction.deleteOriginalMessage();

    if (spawn.type !== type) {
        await module.client.api.channels.editMessage(spawn.channelID, spawn.messageID, {
            attachments: [],
            embeds: [{
                title: "Oh no!",
                description: "You used the wrong command and seemed to scare them off.",
                color: config.defaultColor
            }]
        });

        return;
    }

    const rarity = getRandomRarity();
    const item = items.find((item) => item.parent_id === spawn.monsterID && item.rarity === rarity);
    if (item === undefined) {
        throw new Error(`Item with rarity ${rarity} not found.`);
    }

    const isDuplicate = await module.inventory.has(interaction.guildID, interaction.user.id, item.id);
    await module.client.api.channels.editMessage(spawn.channelID, spawn.messageID, {
        components: [],
        embeds: [{
            title: "Happy Halloween!",
            description: `As a thank you for your kindness, they give <@${interaction.user.id}> one **${item.name}**`,
            image: {
                url: `attachment://${spawn.monsterID}.png`
            },
            footer: {
                text: isDuplicate
                    ? "You already had this item!"
                    : `This item is ${getRarityString(item.rarity)}. ${getRarityFooter(item.rarity)} It's been added to your inventory`
            },
            color: config.defaultColor
        }]
    });

    if (isDuplicate) {
        return;
    }

    const champion = await module.inventory.getTopUser(interaction.guildID);
    await module.inventory.add(interaction.guildID, interaction.user.id, item.id);

    const count = await module.inventory.count(interaction.guildID, interaction.user.id);
    if (count === items.length) {
        await interaction.createFollowupMessage({
            content: `${config.emotes.check} Congratulations! You have collected all items.`,
            flags: MessageFlags.Ephemeral
        });
    }

    if (champion !== undefined && (champion.userID === interaction.user.id || count <= champion.count)) {
        return;
    }

    const settings = await module.settings.getOrCreate(interaction.guildID);
    if (settings.roleID === null) {
        return;
    }

    try {
        await module.client.api.guilds.addRoleToMember(interaction.guildID, interaction.user.id, settings.roleID);
    } catch {
        module.client.logger.warn(`Failed to add role to user ${interaction.user.id} in guild ${interaction.guildID}.`);
    }

    if (champion !== undefined) {
        try {
            await module.client.api.guilds.removeRoleFromMember(interaction.guildID, champion.userID, settings.roleID);
        } catch {
            module.client.logger.warn(`Failed to remove role from user ${champion.userID} in guild ${interaction.guildID}.`);
        }
    }
}
