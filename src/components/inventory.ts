import type { Effect } from "../core/effects/types.js";
import type { ComponentsV2Payload } from "./common.js";

import {
    ActionRowBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder
} from "discord.js";
import {
    ItemRarity,
    TOTAL_ITEMS,
    getItemsByRarity,
    getItemsForMonster,
    getMonster,
    items,
    monsters
} from "../utils/data.js";
import { createContainer, formatCandy, getRarityEmoji, getRarityName } from "./common.js";
import { buildId } from "../utils/customId.js";
import { config } from "../config.js";

/**
 * Represents which part of the collection to show.
 */
export enum InventoryView {
    /**
     * Shows the per-rarity summary, completed sets and active charms.
     */
    Overview = "overview",

    /**
     * Shows every common item.
     */
    Common = "0",

    /**
     * Shows every uncommon item.
     */
    Uncommon = "1",

    /**
     * Shows every rare item.
     */
    Rare = "2",

    /**
     * Shows the items the user is missing.
     */
    Missing = "missing"
}

/**
 * The maximum number of missing items to list before truncating.
 */
const MISSING_LIMIT = 40;

/**
 * The rarity views, in display order.
 */
const RARITY_VIEWS = [InventoryView.Common, InventoryView.Uncommon, InventoryView.Rare] as const;

/**
 * Represents the user whose inventory is shown.
 */
export interface InventoryUser {
    /**
     * The user's avatar URL.
     */
    avatarURL: string;

    /**
     * The user's display name.
     */
    displayName: string;

    /**
     * The user's ID.
     */
    id: string;
}

/**
 * Represents the parameters for {@link createInventoryMessage}.
 */
export interface InventoryMessageInput {
    /**
     * The effects currently active for the user.
     */
    activeEffects: readonly Effect[];

    /**
     * The user's candy balance.
     */
    candy: number;

    /**
     * Whether the user is the current scoreboard champion.
     */
    isChampion: boolean;

    /**
     * The item IDs the user owns.
     */
    owned: ReadonlySet<number>;

    /**
     * The user whose inventory is shown.
     */
    user: InventoryUser;

    /**
     * Which part of the collection to show.
     */
    view: InventoryView;
}

/**
 * Checks whether a raw select value is a known view.
 */
function isInventoryView(value: string): value is InventoryView {
    return (Object.values(InventoryView) as string[]).includes(value);
}

/**
 * Parses a select value back into a view.
 *
 * @param value The raw select value.
 * @returns The matching view, or {@link InventoryView.Overview} when the value doesn't match any view.
 */
export function parseInventoryView(value: string): InventoryView {
    return isInventoryView(value) ? value : InventoryView.Overview;
}

/**
 * Builds the inventory message.
 *
 * @param input The data needed to render the inventory.
 * @returns The message payload.
 */
export function createInventoryMessage(input: InventoryMessageInput): ComponentsV2Payload {
    const summary = `**${input.owned.size}/${TOTAL_ITEMS}** collected · ${formatCandy(input.candy)}`
        + (input.isChampion ? ` · ${config.emojis.crown} Champion` : "");

    const header = new SectionBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ${input.user.displayName}'s Collection`),
            new TextDisplayBuilder().setContent(summary)
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(input.user.avatarURL));

    const body = input.view === InventoryView.Overview
        ? overviewBody(input.owned, input.activeEffects)
        : input.view === InventoryView.Missing
            ? missingBody(input.owned)
            : rarityBody(input.owned, viewRarity(input.view)!);

    const select = new StringSelectMenuBuilder()
        .setCustomId(buildId("inventory", "view", input.user.id))
        .setPlaceholder("Browse items…")
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel("Overview").setValue(InventoryView.Overview).setDefault(input.view === InventoryView.Overview),
            ...RARITY_VIEWS.map((view) => {
                const rarity = viewRarity(view)!;
                return new StringSelectMenuOptionBuilder()
                    .setLabel(`${getRarityName(rarity)} items`).setValue(view)
                    .setEmoji(getRarityEmoji(rarity).toComponent()).setDefault(input.view === view);
            }),
            new StringSelectMenuOptionBuilder().setLabel("Missing items").setValue(InventoryView.Missing).setEmoji(config.emojis.missing.toComponent()).setDefault(input.view === InventoryView.Missing)
        );

    const container = createContainer()
        .addSectionComponents(header);

    for (const block of body) {
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(block));
    }

    container.addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select));
    return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

/**
 * Builds the overview blocks: per-rarity counts, completed sets and active charms.
 */
function overviewBody(owned: ReadonlySet<number>, activeEffects: readonly Effect[]): string[] {
    const counts = RARITY_VIEWS.map((view) => {
        const rarity = viewRarity(view)!;
        const pool = getItemsByRarity(rarity);
        const count = pool.filter((i) => owned.has(i.id)).length;

        return `${getRarityEmoji(rarity)} **${getRarityName(rarity)}** ${count}/${pool.length}`;
    }).join("\n");

    const sets = monsters.filter((m) => getItemsForMonster(m.id).every((i) => owned.has(i.id))).map((m) => m.name);

    let details = `### Completed sets\n${sets.length > 0 ? sets.join(" · ") : "None yet"}`;
    if (activeEffects.length > 0) {
        details += `\n### Active charms\n${activeEffects.map((e) => `${config.emojis[e.emoji]} ${e.name}`).join(" · ")}`;
    }

    return [counts, details];
}

/**
 * Maps a rarity view to the item rarity it shows.
 */
function viewRarity(view: InventoryView): ItemRarity | undefined {
    switch (view) {
        case InventoryView.Common:
            return ItemRarity.Common;
        case InventoryView.Uncommon:
            return ItemRarity.Uncommon;
        case InventoryView.Rare:
            return ItemRarity.Rare;
        default:
            return undefined;
    }
}

/**
 * Builds the block listing every item of a single rarity.
 */
function rarityBody(owned: ReadonlySet<number>, rarity: ItemRarity): string[] {
    const lines = getItemsByRarity(rarity)
        .map((i) => `${owned.has(i.id) ? config.emojis.check : config.emojis.missing} ${i.name}`);

    return [`### ${getRarityEmoji(rarity)} ${getRarityName(rarity)}\n${lines.join("\n")}`];
}

/**
 * Builds the block listing unowned items, capped at {@link MISSING_LIMIT} lines.
 */
function missingBody(owned: ReadonlySet<number>): string[] {
    const missing = items.filter((i) => !owned.has(i.id));
    const lines = missing
        .slice(0, MISSING_LIMIT)
        .map((i) => `${config.emojis.missing} ${i.name} (${getMonster(i.parentID).name})`);

    if (missing.length > MISSING_LIMIT) {
        lines.push(`-# and ${missing.length - MISSING_LIMIT} more`);
    }

    return [`### Missing items\n${lines.length > 0 ? lines.join("\n") : "Nothing! You have everything."}`];
}
