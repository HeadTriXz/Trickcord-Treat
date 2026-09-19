import type { InteractionHandler } from "./router.js";

import { configHandler } from "./config.js";
import { inventoryHandler } from "./inventory.js";
import { scoreboardHandler } from "./scoreboard.js";
import { shopHandler } from "./shop.js";
import { spawnHandler } from "./spawn.js";

/**
 * Every component/modal handler. Add new handlers here.
 */
export const handlers: readonly InteractionHandler[] = [
    spawnHandler,
    inventoryHandler,
    scoreboardHandler,
    shopHandler,
    configHandler
];
