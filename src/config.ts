/**
 * Utility class used to easily access emojis in the config.
 */
export class Emoji {
    /**
     * Whether the emoji is animated.
     */
    animated: boolean;

    /**
     * The ID of the emoji.
     */
    id: string;

    /**
     * The name of the emoji.
     */
    name: string;

    /**
     * Utility class used to easily access emojis in the config.
     *
     * @param name The name of the emoji.
     * @param id The ID of the emoji.
     * @param animated Whether the emoji is animated.
     */
    constructor(name: string, id: string, animated = false) {
        this.animated = animated;
        this.name = name;
        this.id = id;
    }

    /**
     * The URL of the image of the emoji.
     */
    get imageURL(): string {
        return `https://cdn.discordapp.com/emojis/${this.id}.webp`;
    }

    /**
     * Returns the formatted emoji to use in Discord.
     */
    toString(): string {
        return `<${this.animated ? "a" : ""}:${this.name}:${this.id}>`;
    }
}

export default {
    emotes: {
        // General
        check: new Emoji("check", "1290748295911575614"),
        error: new Emoji("error", "1290748346906181722"),

        // Rarity
        common: new Emoji("common", "1290749828602527857"),
        rare: new Emoji("rare", "1290749876409339995"),
        uncommon: new Emoji("uncommon", "1290749854548496466"),

        // Pagination
        next: new Emoji("next", "1290772114735108259"),
        previous: new Emoji("previous", "1290772125807804506"),

        // Config
        add: new Emoji("add", "1290747913227603998"),
        channel: new Emoji("channel", "1290747932705816576"),
        role: new Emoji("role", "1290748051379716097"),
        unknown: new Emoji("unknown", "1290748070803280047")
    },
    defaultColor: 0x5865F2
};
