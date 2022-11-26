/**
 * Utility class used to easily access emojis in the config.
 */
class Emoji {
    /** Whether the emoji is animated. */
    readonly animated: boolean;

    /** The ID of the emoji. */
    readonly id: string;

    /** The name of the emoji. */
    readonly name: string;

    /**
     * Utility class used to easily access emojis in the config.
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
     * Returns the formatted emoji to use in Discord.
     */
    toString() {
        return `<${this.animated ? "a" : ""}:${this.name}:${this.id}>`;
    }
}

export default {
    developers: ["257522665441460225"],
    emotes: {
        check: new Emoji("check", "1004436175307669659"),
        common: new Emoji("common", "1026578109203501136"),
        error: new Emoji("error", "1004436176859578510"),
        ping: new Emoji("ping", "1004496976060108891"),
        rare: new Emoji("rare", "1026578106347163739"),
        uncommon: new Emoji("uncommon", "1026578107374772456")
    },
    defaultColor: 0x5865F2
};
