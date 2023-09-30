import type {
    AnyInteraction,
    CommandInteractionResolvedData,
    GuildTextableChannel,
    InteractionDataOptions
} from "@projectdysnomia/dysnomia";
import type { Client } from "../structures/Client.js";
import type { CommandInteractionOption } from "../structures/commands/CommandManager.js";
import type { SlashCommand } from "../structures/commands/SlashCommand.js";

import { Constants } from "@projectdysnomia/dysnomia";
import { Event } from "../structures/events/Event.js";

type Permissions = keyof Constants["Permissions"];

/**
 * Handles the interactionCreate event.
 */
export default class extends Event {
    /**
     * Handles the interactionCreate event.
     * @param client The client that initialized the event.
     */
    constructor(client: Client) {
        super(client, "interactionCreate");
    }

    /**
     * Handles the interactionCreate event.
     */
    async execute(interaction: AnyInteraction): Promise<void> {
        if (interaction.type === Constants.InteractionTypes["APPLICATION_COMMAND"]) {
            const command = this.client.commands.getCommand(interaction);
            if (!command) return;

            if (interaction.guildID) {
                if (command.botPermissions) {
                    const perms = this.#missingPermissions(
                        <GuildTextableChannel>interaction.channel, interaction.user!.id, command.botPermissions);

                    if (perms.length) {
                        return void interaction.createFollowup(`I am missing the permission(s) \`${perms.join("`, `")}\``);
                    }
                }
            }

            const options = interaction.data.options
                ? this.#getResolvedOptions(interaction.data.options, interaction.data.resolved!, command)
                : {};

            try {
                await command.execute(interaction, options);
            } catch (error: any) {
                this.client.logger.error(command.toString(), error);
            }
        } else if (interaction.type === Constants.InteractionTypes["APPLICATION_COMMAND_AUTOCOMPLETE"]) {
            const command = this.client.commands.getCommand(interaction);
            if (!command) return;

            const option = this.#getFocusedOption(interaction.data);
            if (!option) return;

            const data = command.options.find((x) => x.name === option.name);
            if (!data) return;

            if (!data.autocomplete) {
                return void this.client.logger.warn(command.toString(), "Application command option is missing autocomplete callback.");
            }

            if (data.type === 4 || data.type === 10) {
                if (isNaN(option.value as number)) {
                    return;
                }

                option.value = Number(option.value);
            }

            const results = await data.autocomplete(option.value as never, interaction);
            await interaction.acknowledge(results);
        }
    }

    /**
     * Returns the focused command interaction option.
     * @param obj The received command interaction data.
     * @returns The focused command interaction option.
     */
    #getFocusedOption(obj: CommandInteractionOption): CommandInteractionOption | undefined {
        if (!obj.options) return;
        for (const option of obj.options) {
            if (option.focused) {
                return option;
            }

            if (option.options) {
                const result = this.#getFocusedOption(option);
                if (result) return result;
            }
        }
    }

    /**
     * Parses the received interaction and returns the required options.
     * @param options The raw interaction options.
     * @param resolved The resolved data.
     * @param command The slash command the options are for.
     * @returns The parsed options.
     */
    #getResolvedOptions(
        options: InteractionDataOptions[],
        resolved: CommandInteractionResolvedData,
        command: SlashCommand
    ): Record<string, unknown> {
        if (!options) return {};

        const result: Record<string, unknown> = {};
        for (const option of options) {
            switch (option.type) {
                default:
                case Constants.ApplicationCommandOptionTypes["STRING"]:
                case Constants.ApplicationCommandOptionTypes["INTEGER"]:
                case Constants.ApplicationCommandOptionTypes["BOOLEAN"]:
                case Constants.ApplicationCommandOptionTypes["NUMBER"]:
                    result[option.name] = option.value;
                    break;

                case Constants.ApplicationCommandOptionTypes["USER"]:
                    if ((<any>command.options.find((x) => x.name === option.name))?.isMember) {
                        result[option.name] = resolved?.members?.get(option.value);
                    } else {
                        result[option.name] = resolved?.users?.get(option.value);
                    }
                    break;

                case Constants.ApplicationCommandOptionTypes["CHANNEL"]:
                    result[option.name] = resolved?.channels?.get(option.value);
                    break;

                case Constants.ApplicationCommandOptionTypes["ROLE"]:
                    result[option.name] = resolved?.roles?.get(option.value);
                    break;

                case Constants.ApplicationCommandOptionTypes["MENTIONABLE"]:
                    result[option.name] = resolved?.users?.get(option.value)
                        ?? resolved?.members?.get(option.value)
                        ?? resolved?.roles?.get(option.value);
                    break;

                case Constants.ApplicationCommandOptionTypes["SUB_COMMAND"]:
                case Constants.ApplicationCommandOptionTypes["SUB_COMMAND_GROUP"]:
                    if (option.options) {
                        const temp = this.#getResolvedOptions(option.options, resolved, command);
                        for (const key in temp) {
                            result[key] = temp[key];
                        }
                    }
                    break;
            }
        }

        return result;
    }

    /**
     * Returns an array of permissions that the user is missing.
     * @param channel The channel you want to check the permissions for.
     * @param userID The ID of the user.
     * @param required The required permissions.
     * @returns An array of permissions that the user is missing.
     */
    #missingPermissions(channel: GuildTextableChannel, userID: string, required?: bigint): Permissions[] {
        if (!required) return [];

        const permissions = channel.permissionsOf(userID);
        if (permissions.has("administrator")) return [];

        const result: Permissions[] = [];
        for (const perm in Constants.Permissions) {
            if (required & Constants.Permissions[perm as Permissions]) {
                continue;
            }

            result.push(perm as Permissions);
        }

        return result;
    }
}
