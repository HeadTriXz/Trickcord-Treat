import { type ApplicationCommandInteraction, SlashCommand } from "@barry-bot/core";
import type { MainModule } from "../../main.js";

import { InteractionContextType } from "@discordjs/core";
import { OpenDoorType } from "../../common.js";
import { trickTreat } from "../../utils/trickTreat.js";

/**
 * Represents a slash command that claims a collectible.
 */
export default class extends SlashCommand<MainModule> {
    /**
     * Represents a slash command that claims a collectible.
     *
     * @param module The module the command belongs to.
     */
    constructor(module: MainModule) {
        super(module, {
            name: "trick",
            description: "When someone arrives at your door, trick 'em!",
            contexts: [InteractionContextType.Guild]
        });
    }

    /**
     * Handles the trick or treat interaction with monsters.
     *
     * @param interaction The interaction that triggered the command.
     */
    async execute(interaction: ApplicationCommandInteraction): Promise<void> {
        trickTreat(this.module, interaction, OpenDoorType.Trick);
    }
}
