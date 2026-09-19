import type { ComponentsV2Payload } from "./common.js";
import type { DoorType } from "../core/spawner.js";
import { type Item, type Monster, TOTAL_ITEMS } from "../utils/data.js";

import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder
} from "discord.js";
import { createContainer, getRarityEmoji, getRarityName } from "./common.js";
import { buildId } from "../utils/customId.js";
import { config } from "../config.js";

/**
 * Represents the parameters for {@link createSpawnMessage}.
 */
export interface SpawnMessageInput {
    /**
     * The monster's spawn image.
     */
    image: Buffer;

    /**
     * The monster that spawned.
     */
    monster: Monster;

    /**
     * Which door leads to the item.
     */
    type: DoorType;
}

/**
 * Represents the parameters for {@link createResolvedSpawnMessage}.
 */
export interface ResolvedSpawnInput {
    /**
     * The candy awarded.
     */
    candy: number;

    /**
     * Whether the item was already owned.
     */
    duplicate: boolean;

    /**
     * The monster's spawn image.
     */
    image: Buffer;

    /**
     * The item that was awarded.
     */
    item: Item;

    /**
     * The monster that spawned.
     */
    monster: Monster;

    /**
     * The winner's total items owned afterwards.
     */
    total: number;

    /**
     * The ID of the member who greeted the trick-or-treater first.
     */
    winnerId: string;
}

/**
 * Represents the message payload returned by the spawn message builders.
 */
export interface SpawnPayload extends ComponentsV2Payload {
    /**
     * Empty, so an edit clears the original message's attachments before `files` is applied.
     */
    attachments?: [];

    /**
     * The spawn image attachment, or empty once the trick-or-treater is gone.
     */
    files: AttachmentBuilder[];
}

/**
 * Builds the message posted when a trick-or-treater arrives.
 *
 * @param input The monster, door type and spawn image.
 * @returns The message payload.
 */
export function createSpawnMessage(input: SpawnMessageInput): SpawnPayload {
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(buildId("spawn", "trick")).setLabel("Trick").setEmoji(config.emojis.trick.toComponent()).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(buildId("spawn", "treat")).setLabel("Treat").setEmoji(config.emojis.treat.toComponent()).setStyle(ButtonStyle.Secondary)
    );

    const container = createContainer()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("## A trick-or-treater has stopped by!"))
        .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${imageName(input.monster)}`)))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Open the door and give them a **${input.type}**!`))
        .addActionRowComponents(buttons);

    return {
        components: [container],
        files: [new AttachmentBuilder(input.image, { name: imageName(input.monster) })],
        flags: MessageFlags.IsComponentsV2
    };
}

/**
 * Builds the message after someone greeted the trick-or-treater.
 *
 * @param input The monster, image, winner and outcome of the greet.
 * @returns The message payload.
 */
export function createResolvedSpawnMessage(input: ResolvedSpawnInput): SpawnPayload {
    const sentence = input.duplicate
        ? `<@${input.winnerId}> opened the door first, but already had **${input.item.name}**. The ${input.monster.name} tosses in some candy instead.`
        : `<@${input.winnerId}> opened the door first! The ${input.monster.name} gives them a **${input.item.name}**.`;

    const footer = `-# ${getRarityEmoji(input.item.rarity)} ${getRarityName(input.item.rarity)} · +${input.candy} ${config.emojis.candy} · ${input.total}/${TOTAL_ITEMS} collected`;

    const container = createContainer()
        .addSectionComponents(new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("## Happy Halloween!"),
                new TextDisplayBuilder().setContent(sentence)
            )
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(`attachment://${imageName(input.monster)}`)))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(footer));

    return {
        components: [container],
        files: [new AttachmentBuilder(input.image, { name: imageName(input.monster) })],
        attachments: [],
        flags: MessageFlags.IsComponentsV2
    };
}

/**
 * Builds the message after the trick-or-treater left unnoticed.
 *
 * @returns The message payload.
 */
export function createExpiredSpawnMessage(): SpawnPayload {
    const container = createContainer()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("## The trick-or-treater disappeared…"),
            new TextDisplayBuilder().setContent("No one noticed them and they left.")
        );

    return {
        components: [container],
        files: [],
        attachments: [],
        flags: MessageFlags.IsComponentsV2
    };
}

/**
 * Builds the attachment file name used for a monster's spawn image.
 */
function imageName(monster: Monster): string {
    return `${monster.id}.png`;
}
