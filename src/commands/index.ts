import type { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import type { Context } from "../context.js";

import { configCommand } from "./config.js";
import { inventory } from "./inventory.js";
import { ping } from "./ping.js";
import { scoreboard } from "./scoreboard.js";
import { shop } from "./shop.js";

/**
 * Represents a slash command.
 */
export interface Command {
    /**
     * The command's registration payload.
     */
    data: RESTPostAPIChatInputApplicationCommandsJSONBody;

    /**
     * Executes the command.
     */
    execute(ctx: Context, interaction: ChatInputCommandInteraction): Promise<void>;
}

/**
 * Every slash command. Add new commands here.
 */
export const commands: readonly Command[] = [ping, inventory, scoreboard, shop, configCommand];
