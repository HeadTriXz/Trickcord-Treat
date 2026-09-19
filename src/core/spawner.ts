import type { GuildSettings } from "../database/schema.js";

import { type Monster, monsters } from "../utils/data.js";

/**
 * Represents what the trick-or-treater wants.
 */
export enum DoorType {
    /**
     * The trick-or-treater wants a trick.
     */
    Trick = "trick",

    /**
     * The trick-or-treater wants a treat.
     */
    Treat = "treat"
}

/**
 * Represents why a spawn was refused.
 */
export enum SpawnBlock {
    /**
     * A spawn is already active in the guild.
     */
    Active = "active",

    /**
     * The channel is not allowed to receive spawns.
     */
    Channel = "channel",

    /**
     * The guild is still on cooldown since its last spawn.
     */
    Cooldown = "cooldown",

    /**
     * The user has a role that is ignored for spawns.
     */
    Role = "role"
}

/**
 * Represents a randomly picked monster and door type.
 */
export interface SpawnPick {
    /**
     * The picked monster.
     */
    monster: Monster;

    /**
     * The picked door type.
     */
    type: DoorType;
}

/**
 * Represents the parameters for {@link checkSpawn}.
 */
export interface SpawnCheckInput {
    /**
     * Channel ID where the message was sent.
     */
    channelID: string;

    /**
     * Whether a spawn is currently active.
     */
    hasActive: boolean;

    /**
     * Last spawn time for the guild (ms since epoch).
     */
    lastSpawnAt: number | undefined;

    /**
     * Current time (ms since epoch).
     */
    now: number;

    /**
     * Role IDs of the user who sent the message.
     */
    roleIds: readonly string[];

    /**
     * Guild settings.
     */
    settings: GuildSettings;
}

/**
 * Represents a trick-or-treater currently waiting in a channel.
 */
export interface ActiveSpawn {
    /**
     * Channel where the spawn occurred.
     */
    channelID: string;

    /**
     * When this spawn expires (ms since epoch).
     */
    expiresAt: number;

    /**
     * Message ID of the spawn.
     */
    messageID: string;

    /**
     * ID of the monster being spawned.
     */
    monsterID: number;

    /**
     * Timeout handle for expiry cleanup.
     */
    timer: NodeJS.Timeout;

    /**
     * What the trick-or-treater wants.
     */
    type: DoorType;
}

/**
 * Represents an in-memory registry of active spawns and last spawn times per guild.
 */
export class SpawnStore {
    /**
     * Map of active spawns by guild ID.
     */
    #active = new Map<string, ActiveSpawn>();

    /**
     * Map of last spawn times by guild ID.
     */
    #last = new Map<string, number>();

    /**
     * Current time function.
     */
    #now: () => number;

    /**
     * Set of guild IDs currently reserving a spawn slot (a spawn is in flight but not yet registered).
     */
    #reserved = new Set<string>();

    /**
     * Represents an in-memory registry of active spawns and last spawn times per guild.
     *
     * @param now Returns the current time in milliseconds.
     */
    constructor(now: () => number = Date.now) {
        this.#now = now;
    }

    /**
     * Returns the active spawn of a guild.
     *
     * @param guildID The ID of the guild.
     * @returns The active spawn, or undefined if none exists.
     */
    get(guildID: string): ActiveSpawn | undefined {
        return this.#active.get(guildID);
    }

    /**
     * Returns when the guild last had a spawn (ms since epoch).
     *
     * @param guildID The ID of the guild.
     * @returns The last spawn time, or undefined if the guild has never spawned.
     */
    getLastSpawnAt(guildID: string): number | undefined {
        return this.#last.get(guildID);
    }

    /**
     * Checks whether a guild currently has an active spawn or a reservation in flight.
     *
     * @param guildID The ID of the guild.
     * @returns True if busy.
     */
    isBusy(guildID: string): boolean {
        return this.#active.has(guildID) || this.#reserved.has(guildID);
    }

    /**
     * Checks whether a guild currently holds a spawn reservation.
     *
     * @param guildID The ID of the guild.
     * @returns True if reserved.
     */
    isReserved(guildID: string): boolean {
        return this.#reserved.has(guildID);
    }

    /**
     * Releases a guild's spawn reservation without registering a spawn.
     *
     * @param guildID The ID of the guild.
     */
    release(guildID: string): void {
        this.#reserved.delete(guildID);
    }

    /**
     * Reserves the spawn slot of a guild while a trick-or-treater is being posted.
     *
     * @param guildID The ID of the guild.
     * @returns Whether the reservation was acquired.
     */
    reserve(guildID: string): boolean {
        if (this.#active.has(guildID) || this.#reserved.has(guildID)) {
            return false;
        }

        this.#reserved.add(guildID);
        return true;
    }

    /**
     * Registers a spawn and records the spawn time.
     *
     * @param guildID The ID of the guild.
     * @param spawn The spawn to register.
     */
    set(guildID: string, spawn: ActiveSpawn): void {
        this.#active.set(guildID, spawn);
        this.#last.set(guildID, this.#now());
        this.#reserved.delete(guildID);
    }

    /**
     * Removes and returns the active spawn, clearing its expiry timer.
     *
     * @param guildID The ID of the guild.
     * @returns The active spawn, or undefined if none existed.
     */
    take(guildID: string): ActiveSpawn | undefined {
        const spawn = this.#active.get(guildID);
        if (spawn !== undefined) {
            clearTimeout(spawn.timer);
            this.#active.delete(guildID);
        }

        return spawn;
    }
}

/**
 * Decides whether a spawn is allowed right now, ignoring the random roll.
 *
 * @param input The guild, channel, roles and timing to check.
 * @returns The reason it is blocked, or `null` when allowed.
 */
export function checkSpawn(input: SpawnCheckInput): SpawnBlock | null {
    const { settings } = input;
    if (settings.allowedChannels.length > 0 && !settings.allowedChannels.includes(input.channelID)) {
        return SpawnBlock.Channel;
    }

    if (settings.ignoredChannels.includes(input.channelID)) {
        return SpawnBlock.Channel;
    }

    if (settings.ignoredRoles.some((role) => input.roleIds.includes(role))) {
        return SpawnBlock.Role;
    }

    if (input.hasActive) {
        return SpawnBlock.Active;
    }

    if (input.lastSpawnAt !== undefined && input.now - input.lastSpawnAt < settings.interval * 1000) {
        return SpawnBlock.Cooldown;
    }

    return null;
}

/**
 * Assembles a spawn-check input from stored state and pre-fetched settings, then evaluates it.
 *
 * @param spawns The in-memory spawn registry.
 * @param settings The guild's settings.
 * @param guildID The ID of the guild.
 * @param channelID Channel where the message was sent.
 * @param roleIds Role IDs of the user who sent the message.
 * @param now Current time (ms since epoch). Defaults to `Date.now()`.
 * @returns The reason a spawn is blocked, or `null` when allowed.
 */
export function getSpawnBlock(
    spawns: SpawnStore,
    settings: GuildSettings,
    guildID: string,
    channelID: string,
    roleIds: readonly string[],
    now: number = Date.now()
): SpawnBlock | null {
    return checkSpawn({
        settings: settings,
        channelID: channelID,
        roleIds: roleIds,
        lastSpawnAt: spawns.getLastSpawnAt(guildID),
        hasActive: spawns.isBusy(guildID),
        now: now
    });
}

/**
 * Turns a spawn block into a user-facing sentence.
 *
 * @param block The reason a spawn was refused.
 * @returns The user-facing message for the block.
 */
export function formatSpawnBlock(block: SpawnBlock): string {
    switch (block) {
        case SpawnBlock.Channel: return "Trick-or-treaters don't come to this channel.";
        case SpawnBlock.Role: return "Trick-or-treaters avoid you because of one of your roles.";
        case SpawnBlock.Cooldown: return "The trick-or-treaters need a break. Try again in a bit.";
        case SpawnBlock.Active: return "There's already someone at the door!";
    }
}

/**
 * Rolls whether a message triggers a spawn.
 *
 * @param chance Spawn chance as a percentage (0-100).
 * @param random Returns a number in [0, 1).
 * @returns True if the roll succeeds.
 */
export function rollSpawn(chance: number, random: () => number = Math.random): boolean {
    return random() < chance / 100;
}

/**
 * Picks a random monster and door type.
 *
 * @param random Returns a number in [0, 1).
 * @returns The picked monster and door type.
 */
export function pickSpawn(random: () => number = Math.random): SpawnPick {
    const monster = monsters[Math.floor(random() * monsters.length)]!;
    const type: DoorType = random() < 0.5 ? DoorType.Trick : DoorType.Treat;

    return { monster, type };
}
