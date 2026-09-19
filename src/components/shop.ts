import type { Effect } from "../core/effects/types.js";
import type { ComponentsV2Payload } from "./common.js";

import {
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    TextDisplayBuilder
} from "discord.js";
import { createContainer, formatCandy } from "./common.js";
import { buildId } from "../utils/customId.js";
import { config } from "../config.js";

/**
 * Represents the parameters for {@link createShopMessage}.
 */
export interface ShopMessageInput {
    /**
     * The types of effects currently active for the member.
     */
    activeTypes: ReadonlySet<string>;

    /**
     * The member's candy balance.
     */
    balance: number;

    /**
     * Every purchasable effect.
     */
    effects: readonly Effect[];
}

/**
 * Builds the shop message.
 *
 * @param input The data needed to render the shop.
 * @returns The message payload.
 */
export function createShopMessage(input: ShopMessageInput): ComponentsV2Payload {
    const active = input.effects.filter((e) => input.activeTypes.has(e.type));
    const container = createContainer()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("## Candy Shop"),
            new TextDisplayBuilder().setContent(
                `You have ${formatCandy(input.balance)}.`
                + (active.length > 0 ? `\nActive: ${active.map((e) => `${config.emojis[e.emoji]} ${e.name}`).join(", ")}` : "")
            )
        )
        .addSeparatorComponents(new SeparatorBuilder());

    for (const effect of input.effects) {
        const blocked = input.balance < effect.cost || (!effect.stackable && input.activeTypes.has(effect.type));
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`### ${config.emojis[effect.emoji]} ${effect.name} · ${formatCandy(effect.cost)}`),
                    new TextDisplayBuilder().setContent(effect.description)
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setCustomId(buildId("shop", "buy", effect.type))
                        .setLabel("Buy")
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(blocked)
                )
        );
    }

    return { components: [container], flags: MessageFlags.IsComponentsV2 };
}
