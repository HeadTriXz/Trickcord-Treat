import type { Client } from "../../structures/Client.js";
import { SlashCommand } from "../../structures/commands/SlashCommand.js";

export default class extends SlashCommand {
    constructor(client: Client) {
        super(client, {
            name: "config",
            description: "Modifies the settings of the guild.",
            defaultMemberPermissions: ["administrator"],
            guildOnly: true
        });
    }

    async execute(): Promise<void> {
        throw new Error("Method not implemented");
    }
}
