import type { Database } from "../client.js";

import { type GuildSettings, guildSettings } from "../schema.js";

/**
 * Represents a partial update of guild settings, excluding guildID.
 */
export type GuildSettingsUpdateInput = Partial<Omit<GuildSettings, "guildID">>;

/**
 * Represents optional configuration for a {@link SettingsRepository}.
 */
export interface SettingsRepositoryOptions {
    /**
     * The function to get the current time. Defaults to `Date.now`.
     */
    now?: () => number;

    /**
     * How long a cached entry stays valid, in milliseconds. Defaults to `60000`.
     */
    ttlMs?: number;
}

/**
 * Represents a cache entry for a guild's settings with an expiration time.
 */
interface CacheEntry {
    /**
     * When this entry expires (ms since epoch).
     */
    expiresAt: number;

    /**
     * The cached guild settings.
     */
    value: GuildSettings;
}

/**
 * Represents a repository for guild settings.
 */
export class SettingsRepository {
    /**
     * Cached settings by guild ID.
     */
    #cache = new Map<string, CacheEntry>();

    /**
     * The database client.
     */
    #db: Database;

    /**
     * The function to get the current time.
     */
    #now: () => number;

    /**
     * How long a cached entry stays valid, in milliseconds.
     */
    #ttl: number;

    /**
     * Represents a repository for guild settings.
     *
     * @param db The database instance.
     * @param options Optional configuration. Defaults: ttlMs=60000, now=Date.now.
     */
    constructor(db: Database, options: SettingsRepositoryOptions = {}) {
        this.#db = db;
        this.#ttl = options.ttlMs ?? 60000;
        this.#now = options.now ?? Date.now;
    }

    /**
     * Returns the settings for a guild, creating defaults if none exist.
     *
     * @param guildID The ID of the guild.
     * @returns The guild settings.
     */
    async getOrCreate(guildID: string): Promise<GuildSettings> {
        const cached = this.#cache.get(guildID);
        if (cached !== undefined && cached.expiresAt > this.#now()) {
            return cached.value;
        }

        const [row] = await this.#db.insert(guildSettings)
            .values({ guildID })
            .onConflictDoUpdate({ target: guildSettings.guildID, set: { guildID } })
            .returning();

        return this.#store(guildID, row!);
    }

    /**
     * Upserts the settings for a guild.
     *
     * @param guildID The ID of the guild.
     * @param patch The fields to update or insert.
     * @returns The updated guild settings.
     */
    async update(guildID: string, patch: GuildSettingsUpdateInput): Promise<GuildSettings> {
        const [row] = await this.#db.insert(guildSettings)
            .values({ guildID, ...patch })
            .onConflictDoUpdate({ target: guildSettings.guildID, set: patch })
            .returning();

        return this.#store(guildID, row!);
    }

    /**
     * Stores a settings value in the cache and returns it.
     *
     * @param guildID The ID of the guild.
     * @param value The guild settings to cache.
     * @returns The cached value.
     */
    #store(guildID: string, value: GuildSettings): GuildSettings {
        const expiresAt = this.#now() + this.#ttl;
        this.#cache.set(guildID, { value, expiresAt });
        return value;
    }
}
