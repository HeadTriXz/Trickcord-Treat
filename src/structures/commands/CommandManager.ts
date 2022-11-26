import type {
    AutocompleteInteraction,
    ChatInputApplicationCommandStructure,
    CommandInteraction
} from "eris";
import type { Client } from "../Client.js";
import type { SlashCommand } from "./SlashCommand.js";

import fs from "fs/promises";
import { Collection } from "../../utils/Collection.js";

/**
 * Represents an option of an application command.
 */
export interface CommandInteractionOption {
    /** Whether the option is currently focused for autocomplete. */
    focused?: boolean;

    /** The name of the parameter. */
    name: string;

    /** Present if this option is a subcommand (group). */
    options?: CommandInteractionOption[];

    /** The application command option type. */
    type: number;

    /** Value of the option resulting from user input. */
    value?: unknown;
}

/**
 * Manages message commands and cooldowns.
 */
export class CommandManager extends Collection<SlashCommand> {
    /**
     * Manages message commands and cooldowns.
     * @param client The client that initialized the command manager.
     */
    constructor(public client: Client) {
        super();

        this.loadCommands("./commands/").catch((err) => {
            this.client.logger.error("CommandManager", err);
        });
    }

    /**
     * Get a command based on the provided interaction.
     * @param interaction The received command interaction.
     */
    getCommand(interaction: CommandInteraction | AutocompleteInteraction): SlashCommand | undefined {
        let data: CommandInteractionOption | undefined = interaction.data;
        let command = this.get(data.name);
        if (!command) {
            return void this.client.logger.warn("CommandManager", `Unknown command "${data.name}"`);
        }

        while ((data = data.options?.[0])) {
            if (data.type === 1 || data.type === 2) {
                const subcommand: SlashCommand | undefined = command?.children?.get(data.name);
                if (!subcommand) {
                    return void this.client.logger.warn("CommandManager", `Unknown subcommand "${data.name}"`);
                }

                command = subcommand;
            }
        }

        return command;
    }

    /**
     * Load all commands recursively in the provided folder.
     * @param path The folder that contains the commands.
     */
    async loadCommands(path: string): Promise<void>;

    /**
     * Load all subcommands recursively in the provided folder.
     * @param path The folder that contains the subcommands.
     */
    async loadCommands(path: string, parent?: SlashCommand): Promise<void>;
    async loadCommands(path: string, parent?: SlashCommand): Promise<void> {
        const entries = await fs.readdir(path, { withFileTypes: true });
        if (!entries) return;

        const files = entries
            .filter((e) => !e.isDirectory())
            .map((f) => ({
                ...f,
                path: path + f.name
            }));

        const file = files.find((f) => f.name === "index.js");
        if (file) {
            const Command = ((r) => r.default || r)(await import(`../.${file.path}`));
            if (Object.getPrototypeOf(Command)?.name !== "SlashCommand") {
                return this.client.logger.warn("CommandManager", "You must inherit the \"SlashCommand\" class");
            }

            const command: SlashCommand = new Command(this.client);
            if (!parent) {
                this.set(command.name, command);
            } else {
                if (command.botPermissions == null) {
                    command.botPermissions = parent.botPermissions;
                }

                if (!parent.children) {
                    parent.children = new Collection();
                }

                parent.children.set(command.name, command);
            }

            parent = command;
        }

        const folders = entries.filter((e) => e.isDirectory());
        if (!folders) return;

        for (const folder of folders) {
            await this.loadCommands(`${path}${folder.name}/`, parent);
        }
    }

    /**
     * Registers all current commands to Discord.
     */
    async registerCommands(): Promise<void> {
        const guildCommands: Record<string, ChatInputApplicationCommandStructure[]> = {};
        const globalCommands = [];

        for (const command of this.values()) {
            const json = command.toJSON();
            if (command.guilds?.length) {
                for (const guildID of command.guilds) {
                    if (!guildCommands[guildID]) {
                        guildCommands[guildID] = [json];
                    } else {
                        guildCommands[guildID].push(json);
                    }
                }
            } else {
                globalCommands.push(json);
            }
        }

        if (globalCommands.length) {
            const registeredCommands = await this.client.bulkEditCommands(globalCommands);
            for (const registeredCommand of registeredCommands) {
                const command = this.find((x) => x.name === registeredCommand.name);
                if (command) {
                    command.id = registeredCommand.id;
                }
            }
        }

        for (const [guildID, commands] of Object.entries(guildCommands)) {
            const registeredCommands = await this.client.bulkEditGuildCommands(guildID, commands);
            for (const registeredCommand of registeredCommands) {
                const command = this.find((x) => x.name === registeredCommand.name);
                if (command) {
                    command.id = registeredCommand.id;
                }
            }
        }
    }
}
