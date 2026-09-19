import type { GuildSettings } from "../../src/database/schema.js";

/**
 * Builds a `GuildSettings` object for tests, with sensible defaults.
 *
 * @param overrides Fields to override.
 * @returns The settings object.
 */
export function makeSettings(overrides: Partial<GuildSettings> = {}): GuildSettings {
    return {
        guildID: "g",
        chance: 20,
        interval: 300,
        timeout: 60,
        roleID: null,
        allowedChannels: [],
        ignoredChannels: [],
        ignoredRoles: [],
        ...overrides
    };
}
