import type {
    ChatInputApplicationCommandStructure,
    CommandInteraction
} from "@projectdysnomia/dysnomia";
import type {
    ApplicationCommandOptionsRaw,
    ApplicationCommandOptionsResolved
} from "./options.js";
import type { Client } from "../Client.js";
import type { Collection } from "../../utils/Collection.js";

import { Constants } from "@projectdysnomia/dysnomia";

type Permissions = keyof Constants["Permissions"];

/**
 * Options for a {@link SlashCommand}.
 */
export interface SlashCommandOptions {
    /** An array of permissions that the bot requires. */
    botPermissions?: Permissions[];

    /** An array of permissions that members require by default. */
    defaultMemberPermissions?: Permissions[];

    /** A description of the command. */
    description: string;

    /** Whether the command can only be used inside a guild. */
    guildOnly?: boolean;

    /** Array of guild IDs the command is available in. */
    guilds?: string[];

    /** The name of the command. */
    name: string;

    /** Parameters for the command. */
    options?: Record<string, ApplicationCommandOptionsRaw>;
}

/**
 * Converts an array of permissions to a bit set.
 * @param permissions Array of permissions.
 */
function permissionsToInt(permissions: Permissions[]): bigint {
    let bitmask = 0n;
    for (const permission of permissions) {
        bitmask |= Constants.Permissions[permission];
    }

    return bitmask;
}

/**
 * Represents a slash command.
 * @abstract
 */
export abstract class SlashCommand {
    /** Set of permissions represented as a bit set. */
    botPermissions?: bigint;

    /** A collection of subcommands. */
    children?: Collection<SlashCommand>;

    /** Set of permissions represented as a bit set. */
    defaultMemberPermissions?: bigint;

    /** The description of the command. */
    description: string;

    /** Whether the command can only be used inside a guild. */
    guildOnly: boolean;

    /** Array of guild IDs the command is available in. */
    guilds?: string[];

    /** The ID of the command. */
    id?: string;

    /** The name of the command. */
    name: string;

    /** Parameters for the command. */
    options: ApplicationCommandOptionsRaw[] = [];

    /**
     * Represents a slash command.
     * @param client The client that initialized the command.
     * @param options Options for the command.
     */
    constructor(public client: Client, options: SlashCommandOptions) {
        if (Array.isArray(options.botPermissions)) {
            this.botPermissions = permissionsToInt(options.botPermissions);
        }

        if (Array.isArray(options.defaultMemberPermissions)) {
            this.defaultMemberPermissions = permissionsToInt(options.defaultMemberPermissions);
        }

        this.description = options.description;
        this.guildOnly = options.guildOnly!;
        this.guilds = options.guilds;
        this.name = options.name;

        if (options.options !== undefined) {
            for (const key in options.options) {
                options.options[key].name = key;
                this.options.push(options.options[key]);
            }
        }
    }

    abstract execute(interaction: CommandInteraction, options: Record<string, any>): Promise<void>;

    /**
     * Returns an array of command options including subcommands.
     */
    getOptions(): ApplicationCommandOptionsResolved[] {
        const options = this.options.map((x) => ({
            ...x,
            autocomplete: !!x.autocomplete
        }));

        const subcommands: ApplicationCommandOptionsResolved[] | undefined = this.children?.toArray().map((c) => ({
            name: c.name,
            description: c.description,
            options: c.getOptions().map((x) => ({ ...x, autocomplete: !!x.autocomplete })),
            type: c.children
                ? Constants.ApplicationCommandOptionTypes["SUB_COMMAND_GROUP"]
                : Constants.ApplicationCommandOptionTypes["SUB_COMMAND"]
        }));

        if (subcommands) {
            return subcommands.concat(options);
        }

        return options;
    }

    /**
     * Returns an object with the properties required to register a new command.
     */
    toJSON(): ChatInputApplicationCommandStructure {
        return {
            defaultMemberPermissions: this.defaultMemberPermissions?.toString(),
            description: this.description,
            dmPermission: !this.guildOnly,
            name: this.name,
            options: this.getOptions() as any,
            type: Constants.ApplicationCommandTypes["CHAT_INPUT"]
        };
    }

    /**
     * Returns a string representing the command.
     */
    toString(): string {
        return `SlashCommand<${this.name}>`;
    }
}
