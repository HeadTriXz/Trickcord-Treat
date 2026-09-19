import type { MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";
import type { Context } from "../context.js";

import { type ParsedCustomId, parseId } from "../utils/customId.js";

/**
 * Represents any interaction carrying a custom id.
 */
export type ComponentInteraction = MessageComponentInteraction | ModalSubmitInteraction;

/**
 * Represents a handler for every interaction whose custom id starts with `scope`.
 */
export interface InteractionHandler {
    /**
     * The scope this handler owns.
     */
    scope: string;

    /**
     * Handles a matching interaction.
     */
    execute(ctx: Context, interaction: ComponentInteraction, id: ParsedCustomId): Promise<void>;
}

/**
 * Creates a dispatcher that routes interactions to handlers by scope.
 *
 * @param handlers The handlers to dispatch to.
 * @returns A function that routes one interaction to the matching handler.
 */
export function createRouter(
    handlers: readonly InteractionHandler[]
): (ctx: Context, interaction: ComponentInteraction) => Promise<void> {
    const byScope = new Map(handlers.map((h) => [h.scope, h]));

    return async (ctx, interaction) => {
        const id = parseId(interaction.customId);
        const handler = byScope.get(id.scope);
        if (handler === undefined) {
            ctx.logger.warn({ customId: interaction.customId }, "No handler for interaction");
            return;
        }

        await handler.execute(ctx, interaction, id);
    };
}
