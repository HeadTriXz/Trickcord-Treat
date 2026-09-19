import type { Effect } from "./types.js";
import { lure } from "./lure.js";
import { sugarRush } from "./sugarRush.js";
import { sweetTooth } from "./sweetTooth.js";

/**
 * Every purchasable effect, in shop order.
 */
export const effects: readonly Effect[] = [lure, sugarRush, sweetTooth];

export type { Effect, EffectHooks, PurchaseContext, SpawnGate } from "./types.js";
