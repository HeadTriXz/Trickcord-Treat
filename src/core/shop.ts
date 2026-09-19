import type { GameDeps } from "../context.js";
import type { PurchaseContext } from "./effects/types.js";

import { createRepositories } from "../database/repositories/index.js";
import { UserError } from "../utils/errors.js";

/**
 * Represents the outcome of a purchase.
 */
export interface PurchaseResult {
    /**
     * The member's balance afterwards.
     */
    balance: number;
}

/**
 * Buys an effect for a member. The candy is refunded if the effect fails to apply.
 *
 * @param deps The database and the available effects.
 * @param type The type of the effect to purchase.
 * @param ctx The context of the purchase.
 * @returns The member's balance afterwards.
 */
export async function purchase(deps: GameDeps, type: string, ctx: PurchaseContext): Promise<PurchaseResult> {
    const effect = deps.effects.find((e) => (e.type as string) === type);
    if (effect === undefined) {
        throw new UserError("That item doesn't exist.");
    }

    const refusal = await effect.hooks.canPurchase?.(ctx);
    if (refusal !== undefined && refusal !== null) {
        throw new UserError(refusal);
    }

    const { balance, effectID } = await deps.db.transaction(async (tx) => {
        const txRepos = createRepositories(tx);

        const member = await txRepos.members.getOrCreate(ctx.guildID, ctx.userID);
        if (member.candy < effect.cost) {
            throw new UserError(`You need ${effect.cost} candy for that, but you only have ${member.candy}.`);
        }

        if (!effect.stackable) {
            const active = await txRepos.activeEffects.getActive(ctx.guildID, ctx.userID);
            if (active.some((row) => row.type === (effect.type as string))) {
                throw new UserError(`You already have ${effect.name} active.`);
            }
        }

        const balance = await txRepos.members.addCandy(ctx.guildID, ctx.userID, -effect.cost);
        let effectID: number | undefined;
        if (effect.stored) {
            const row = await txRepos.activeEffects.create({
                guildID: ctx.guildID,
                userID: ctx.userID,
                type: effect.type
            });
            effectID = row.id;
        }

        return { balance, effectID };
    });

    try {
        await effect.hooks.onPurchase?.(ctx);
    } catch (error) {
        const repositories = createRepositories(deps.db);
        await repositories.members.addCandy(ctx.guildID, ctx.userID, effect.cost);
        if (effectID !== undefined) {
            await repositories.activeEffects.consume([effectID]);
        }

        if (error instanceof UserError) {
            throw error;
        }

        throw new UserError(`Couldn't complete the purchase, your ${effect.cost} candy was refunded.`);
    }

    return { balance };
}
