import type { GameDeps } from "../context.js";
import type { LeaderboardEntry } from "../database/repositories/index.js";
import type { Effect } from "./effects/types.js";

import { type Item, TOTAL_ITEMS, getItemsForMonster } from "../utils/data.js";
import { DEFAULT_WEIGHTS, rollRarity } from "./rarity.js";
import { createRepositories } from "../database/repositories/index.js";
import { config } from "../config.js";

/**
 * Represents a champion role handover.
 */
export interface ChampionChange {
    /**
     * The ID of the new champion.
     */
    newChampion: string;

    /**
     * The ID of the previous champion, if any.
     */
    previous: string | undefined;
}

/**
 * Represents dependencies for resolving a greet.
 */
export interface GreetDeps extends GameDeps {
    /**
     * A function returning a number in [0, 1). Defaults to `Math.random`.
     */
    random?: () => number;
}

/**
 * Represents the guild, user, and monster involved in a greet.
 */
export interface GreetInput {
    /**
     * The ID of the guild.
     */
    guildID: string;

    /**
     * The ID of the monster being greeted.
     */
    monsterID: number;

    /**
     * The ID of the user.
     */
    userID: string;
}

/**
 * Represents the outcome of a win.
 */
export interface GreetResult {
    /**
     * Types of the charms that were applied to this win and consumed.
     */
    appliedEffects: string[];

    /**
     * The member's balance afterwards.
     */
    balance: number;

    /**
     * Candy awarded by this greet.
     */
    candy: number;

    /**
     * Whether the member now owns every item.
     */
    collectedAll: boolean;

    /**
     * Whether the item was already owned.
     */
    duplicate: boolean;

    /**
     * The item that was awarded.
     */
    item: Item;

    /**
     * Items owned afterwards.
     */
    total: number;
}

/**
 * Resolves a win: applies active effects, rolls the item, awards it and candy.
 *
 * @param deps The dependencies for resolving the greet.
 * @param input The guild, user, and monster involved in the greet.
 * @returns The outcome of the win.
 */
export async function resolveGreet(deps: GreetDeps, input: GreetInput): Promise<GreetResult> {
    const random = deps.random ?? Math.random;
    const byType = new Map<string, Effect>(deps.effects.map((e) => [e.type, e]));

    return deps.db.transaction(async (tx) => {
        const repositories = createRepositories(tx);
        const [, active, ownedItemIds] = await Promise.all([
            repositories.members.getOrCreate(input.guildID, input.userID),
            repositories.activeEffects.getActive(input.guildID, input.userID),
            repositories.inventory.getByUser(input.guildID, input.userID)
        ]);
        const ownedIds = new Set(ownedItemIds);

        let weights = DEFAULT_WEIGHTS;
        let candidates = getItemsForMonster(input.monsterID);
        const applied: number[] = [];
        const appliedEffects: string[] = [];

        for (const row of active) {
            const effect = byType.get(row.type);
            if (effect === undefined || !effect.consumedOnWin) {
                continue;
            }

            if (effect.hooks.rarityWeights !== undefined) {
                weights = effect.hooks.rarityWeights(weights);
            }

            if (effect.hooks.pickItem !== undefined) {
                candidates = effect.hooks.pickItem(candidates, ownedIds);
            }

            applied.push(row.id);
            appliedEffects.push(row.type);
        }

        const rarity = rollRarity(weights, candidates.map((i) => i.rarity), random);
        const item = candidates.find((i) => i.rarity === rarity)!;

        const duplicate = ownedIds.has(item.id);
        if (!duplicate) {
            await repositories.inventory.add(input.guildID, input.userID, item.id);
        }

        const candy = duplicate ? config.candy.dupe : config.candy.greet;
        const balance = await repositories.members.addCandy(input.guildID, input.userID, candy);
        await repositories.activeEffects.consume(applied);

        const total = ownedIds.size + (duplicate ? 0 : 1);
        const collectedAll = total === TOTAL_ITEMS;
        return { item, duplicate, candy, balance, total, collectedAll, appliedEffects };
    });
}

/**
 * Compares the scoreboard leader before and after an award.
 *
 * @param before The top entry before the award.
 * @param after The top entry after the award.
 * @returns The handover to perform, or `null` if the leader did not change.
 */
export function getChampionChange(
    before: LeaderboardEntry | undefined,
    after: LeaderboardEntry | undefined
): ChampionChange | null {
    if (after === undefined || before?.userID === after.userID) {
        return null;
    }

    return { newChampion: after.userID, previous: before?.userID };
}
