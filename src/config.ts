import type { APIMessageComponentEmoji } from "discord.js";

/**
 * Represents a key of `config.emojis`.
 */
export type EmojiKey = keyof typeof config.emojis;

/**
 * A custom or unicode emoji usable in text and components.
 */
export class Emoji {
    /**
     * Whether the emoji is animated. Always `false` for unicode emojis.
     */
    animated: boolean;

    /**
     * The ID of the emoji.
     */
    id: string | null;

    /**
     * The emoji's name, or the unicode character for unicode emojis.
     */
    name: string;

    /**
     * Represents a custom or unicode emoji usable in text and components.
     *
     * @param name The emoji's name, or the unicode character for unicode emojis.
     * @param id The emoji's snowflake ID, or `null` for unicode emojis.
     * @param animated Whether the emoji is animated (defaults to `false`).
     */
    constructor(name: string, id: string | null, animated = false) {
        this.animated = animated;
        this.id = id;
        this.name = name;
    }

    /**
     * Creates a unicode emoji.
     *
     * @param character The unicode character.
     * @returns The created emoji.
     */
    static unicode(character: string): Emoji {
        return new Emoji(character, null);
    }

    /**
     * Returns the emoji in the shape expected by buttons and select options.
     *
     * @returns The emoji as a component emoji.
     */
    toComponent(): APIMessageComponentEmoji {
        return this.id === null
            ? { name: this.name }
            : { id: this.id, name: this.name, animated: this.animated };
    }

    /**
     * Returns the emoji formatted for message text.
     *
     * @returns The formatted emoji.
     */
    toString(): string {
        if (this.id === null) {
            return this.name;
        }

        return `<${this.animated ? "a" : ""}:${this.name}:${this.id}>`;
    }
}

/**
 * The application's configuration.
 */
export const config = {
    /**
     * Candy rewards and penalties.
     */
    candy: {
        greet: 5,
        dupe: 10,
        scare: -3
    },
    colors: {
        default: 0x5865F2
    },
    emojis: {
        // General
        check: new Emoji("check", "1290748295911575614"),
        error: new Emoji("error", "1290748346906181722"),
        crown: Emoji.unicode("👑"),
        missing: new Emoji("missing", "1549883214577799250"),

        // Game
        candy: Emoji.unicode("🍬"),
        trick: new Emoji("pumpkin", "1549883381322612817"),
        treat: new Emoji("lollipop", "1549883379208556675"),

        // Effects
        lure: new Emoji("lure", "1549887478759034910"),
        sugarRush: new Emoji("rush", "1549887481778933881"),
        sweetTooth: new Emoji("sweettooth", "1549887482840092793"),

        // Rarity
        common: new Emoji("common", "1290749828602527857"),
        uncommon: new Emoji("uncommon", "1290749854548496466"),
        rare: new Emoji("rare", "1290749876409339995"),

        // Pagination
        next: new Emoji("chevronright", "1550559050620469319"),
        previous: new Emoji("chevronleft", "1550559049379094578"),

        // Config
        add: new Emoji("add", "1290747913227603998"),
        channel: new Emoji("channel", "1290747932705816576"),
        role: new Emoji("role", "1290748051379716097"),
        unknown: new Emoji("unknown", "1290748070803280047")
    }
} as const;
