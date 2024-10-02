import type { APIInteractionResponseCallbackData } from "@discordjs/core";
import config from "./config.js";

/**
 * Represents the current monster that is spawned.
 */
export interface CurrentMonster {
    /**
     * The ID of the channel where the monster is located.
     */
    channelID: string;

    /**
     * When the monster should disappear.
     */
    expiresAt: number;

    /**
     * The ID of the monster.
     */
    messageID: string;

    /**
     * The ID of the monster.
     */
    monsterID: number;

    /**
     * The type of response the user has to give.
     */
    type: OpenDoorType;
}

/**
 * Represents an item in the inventory.
 */
export interface Item {
    /**
     * The ID of the item.
     */
    id: number;

    /**
     * The monster that the item belongs to.
     */
    parent_id: number;

    /**
     * The name of the item.
     */
    name: string;

    /**
     * The rarity of the item.
     */
    rarity: number;
}

/**
 * The type of response the user gave.
 */
export enum OpenDoorType {
    Trick = "trick",
    Treat = "treat"
}

/**
 * The content for a timeout message.
 */
export const timeoutContent: APIInteractionResponseCallbackData = {
    components: [],
    content: `${config.emotes.error} It took you too long to respond. Please try again.`,
    embeds: []
};
