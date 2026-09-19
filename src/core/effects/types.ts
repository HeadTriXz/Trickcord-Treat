import type { EmojiKey } from "../../config.js";
import type { Item } from "../../utils/data.js";
import type { RarityWeights } from "../rarity.js";
import type { SpawnBlock } from "../spawner.js";

/**
 * Represents the unique identifier of a purchasable effect.
 */
export enum EffectType {
    /**
     * Summons a trick-or-treater to the current channel.
     */
    Lure = "lure",

    /**
     * Boosts the rarity odds of the next win.
     */
    SugarRush = "sugar_rush",

    /**
     * Guarantees the next win is not a duplicate.
     */
    SweetTooth = "sweet_tooth"
}

/**
 * Lets effects ask the Discord layer to spawn a monster.
 */
export interface SpawnGate {
    /**
     * Check whether a spawn is allowed.
     */
    check: (guildID: string, channelID: string, roleIds: string[]) => Promise<SpawnBlock | null>;

    /**
     * Spawn a monster in the given channel. Rejects with a {@link UserError} if the spawn could not be started.
     */
    spawn: (guildID: string, channelID: string) => Promise<void>;
}

/**
 * Everything an effect may need while being purchased.
 */
export interface PurchaseContext {
    /**
     * Channel where the purchase happens.
     */
    channelID: string;

    /**
     * Guild where the purchase happens.
     */
    guildID: string;

    /**
     * Roles of the user making the purchase.
     */
    roleIds: string[];

    /**
     * Gate to ask for spawn permission or trigger a spawn.
     */
    spawner: SpawnGate;

    /**
     * User making the purchase.
     */
    userID: string;
}

/**
 * Optional behavior an effect can plug into the game.
 */
export interface EffectHooks {
    /**
     * Returns a user-facing reason the purchase must be refused, or `null` to allow it.
     */
    canPurchase?: (ctx: PurchaseContext) => Promise<string | null>;

    /**
     * Runs after the candy has been deducted.
     */
    onPurchase?: (ctx: PurchaseContext) => Promise<void>;

    /**
     * Narrows the items the next win may award. Return the input unchanged to signal "no effect".
     */
    pickItem?: (candidates: Item[], owned: ReadonlySet<number>) => Item[];

    /**
     * Transforms the rarity weights of the next win.
     */
    rarityWeights?: (weights: RarityWeights) => RarityWeights;
}

/**
 * Represents a purchasable effect.
 */
export interface Effect {
    /**
     * Whether an active instance of this effect is consumed when its member wins a greet.
     */
    consumedOnWin: boolean;

    /**
     * Cost in candy to purchase this effect.
     */
    cost: number;

    /**
     * User-facing description of the effect.
     */
    description: string;

    /**
     * Emoji to display for this effect.
     */
    emoji: EmojiKey;

    /**
     * Hooks this effect provides.
     */
    hooks: EffectHooks;

    /**
     * Display name of the effect.
     */
    name: string;

    /**
     * Whether more than one may be active at once.
     */
    stackable: boolean;

    /**
     * Whether the purchase is stored as an active effect.
     */
    stored: boolean;

    /**
     * Unique identifier for this effect.
     */
    type: EffectType;
}
