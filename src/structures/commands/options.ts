import type {
    ApplicationCommandOptionChoices,
    AutocompleteInteraction,
    ChannelTypes
} from "eris";
import { Constants } from "eris";


// TYPES
type Awaitable<T> = T | Promise<T>;
export type ApplicationCommandOption<T extends ApplicationCommandOptionType = ApplicationCommandOptionType>
    = ApplicationCommandOptionWithAutocomplete<T> | ApplicationCommandOptionWithChoices<T>;

export type ApplicationCommandOptionType = keyof Constants["ApplicationCommandOptionTypes"];

export type AutocompleteCallback<T extends ApplicationCommandOptionType = ApplicationCommandOptionType> =
    T extends "STRING" | "INTEGER" | "NUMBER"
        ? (
            value: T extends "STRING" ? string : T extends "INTEGER" | "NUMBER" ? number : never,
            interaction: AutocompleteInteraction
        ) => Awaitable<ApplicationCommandOptionChoice<T>[]>
        : never;


// INTERFACES

/**
 * Represents a command option.
 */
export interface ApplicationCommandOptionBase<T extends ApplicationCommandOptionType = ApplicationCommandOptionType> {
    /** The channels shown will be restricted to these types. */
    channelTypes?: T extends "CHANNEL" ? ChannelTypes[] : never;

    /** The description of the option. (1-100 characters) */
    description: string;

    /** Maximum value or length. */
    maximum?: T extends "STRING" | "INTEGER" | "NUMBER" ? number : never;

    /** Minimum value or length. */
    minimum?: T extends "STRING" | "INTEGER" | "NUMBER" ? number : never;

    /** Whether this option is required. */
    required?: boolean;
}

/**
 * Represents a command option choice.
 */
interface ApplicationCommandOptionChoice<T extends "STRING" | "INTEGER" | "NUMBER"> {
    /** The name of the choice. */
    name: string;

    /** The value for the choice. */
    value: T extends "STRING" ? string : number;
}

/**
 * Represents a raw application command option.
 */
interface ApplicationCommandOptionsBase<
    T extends ApplicationCommandOptionType = ApplicationCommandOptionType
> {
    /** Choices for the user to pick from. */
    choices?: T extends "STRING" | "INTEGER" | "NUMBER"
        ? ApplicationCommandOptionChoices<T> : never;

    /** The description of the option. (1-100 characters) */
    description: string;

    /** Maximum length of a string. */
    max_length?: T extends "STRING" ? number : never;

    /** Maximum value of a number or integer. */
    max_value?: T extends "INTEGER" | "NUMBER" ? number : never;

    /** Minimum length of a string. */
    min_length?: T extends "STRING" ? number : never;

    /** Minimum value of a number or string. */
    min_value?: T extends "INTEGER" | "NUMBER" ? number : never;

    /** The name of the parameter. */
    name: string;

    /** Whether this option is required. */
    required?: boolean;

    /** The type of option. */
    type: Constants["ApplicationCommandOptionTypes"][T];
}

/**
 * Represents a raw application command option.
 */
export interface ApplicationCommandOptionsRaw<
    T extends ApplicationCommandOptionType = ApplicationCommandOptionType
> extends ApplicationCommandOptionsBase<T> {
    /** Callback for autocomplete interactions. */
    autocomplete?: AutocompleteCallback<T>;
}

/**
 * Represents a resolved application command option.
 */
export interface ApplicationCommandOptionsResolved<
    T extends ApplicationCommandOptionType = ApplicationCommandOptionType
> extends ApplicationCommandOptionsBase<T> {
    /** Callback for autocomplete interactions. */
    autocomplete?: boolean;

    /** If the option is a subcommand (group), these will be the parameters. */
    options?: T extends "SUB_COMMAND" | "SUB_COMMAND_GROUP"
        ? ApplicationCommandOptionsResolved[] : never;
}

/**
 * Represents a command option with autocomplete interactions enabled.
 */
export interface ApplicationCommandOptionWithAutocomplete<
    T extends ApplicationCommandOptionType = ApplicationCommandOptionType
> extends ApplicationCommandOptionBase {
    /** Callback for autocomplete interactions. */
    autocomplete?: AutocompleteCallback<T>;

    /** Choices for the user to pick from. */
    choices?: never;
}

/**
 * Represents a command option with choices for the user to pick from.
 */
export interface ApplicationCommandOptionWithChoices<
    T extends ApplicationCommandOptionType = ApplicationCommandOptionType
> extends ApplicationCommandOptionBase {
    /** Callback for autocomplete interactions. */
    autocomplete?: never;

    /** Choices for the user to pick from. */
    choices?: T extends "STRING" | "INTEGER" | "NUMBER"
        ? ApplicationCommandOptionChoice<T>[] : never;
}


/**
 * Converts a type into a resolver.
 * @param type The type of the option.
 */
export function convertToResolver<
    T extends ApplicationCommandOptionType = ApplicationCommandOptionType
>(type: T, isMember?: boolean) {
    return (options: ApplicationCommandOption<T>): ApplicationCommandOptionsRaw<T> => {
        // Eris' types are not made for this.
        const option: any = {
            description: options.description,
            required: options.required,
            type: Constants.ApplicationCommandOptionTypes[type],
            isMember: isMember
        };

        if (options.maximum !== undefined) {
            if (type === "STRING") {
                option.max_length = options.maximum;
            }

            if (type === "INTEGER" || type === "NUMBER") {
                option.max_value = options.maximum;
            }
        }

        if (options.minimum !== undefined) {
            if (type === "STRING") {
                option.min_length = options.minimum;
            }

            if (type === "INTEGER" || type === "NUMBER") {
                option.min_value = options.minimum;
            }
        }

        if (type === "CHANNEL") {
            option.channel_types = options.channelTypes;
        }

        if (options.autocomplete !== undefined) {
            if (options.choices?.length) {
                throw new Error("\"autocomplete\" may not be set if \"choices\" is present.");
            }

            option.autocomplete = options.autocomplete;
        }

        if (options.choices?.length) {
            option.choices = options.choices;
        }

        return option;
    };
}

export const resolvers = {
    string: convertToResolver("STRING"),
    integer: convertToResolver("INTEGER"),
    boolean: convertToResolver("BOOLEAN"),
    user: convertToResolver("USER"),
    member: convertToResolver("USER", true),
    channel: convertToResolver("CHANNEL"),
    role: convertToResolver("ROLE"),
    mentionable: convertToResolver("MENTIONABLE"),
    number: convertToResolver("NUMBER"),
    attachment: convertToResolver("ATTACHMENT")
};
