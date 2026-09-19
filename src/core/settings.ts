import type { EmojiKey } from "../config.js";
import type { GuildSettings } from "../database/schema.js";
import type { GuildSettingsUpdateInput } from "../database/repositories/index.js";

import { UserError } from "../utils/errors.js";

/**
 * Represents how a setting is edited.
 */
export enum SettingKind {
    /**
     * The setting is edited as a multi-channel select.
     */
    Channels = "channels",

    /**
     * The setting is edited as a whole number within a range.
     */
    Integer = "integer",

    /**
     * The setting is edited as a single-role select.
     */
    Role = "role",

    /**
     * The setting is edited as a multi-role select.
     */
    Roles = "roles"
}

/**
 * Every configurable setting, in display order.
 */
export const SETTINGS: readonly SettingDescriptor[] = [
    {
        key: "chance",
        label: "Chance",
        description: "The chance a message summons a trick-or-treater (in percent).",
        kind: SettingKind.Integer,
        emoji: "add",
        min: 0,
        max: 100,
        unit: "%"
    },
    {
        key: "interval",
        label: "Interval",
        description: "Minimum seconds between trick-or-treaters.",
        kind: SettingKind.Integer,
        emoji: "add",
        min: 60,
        max: 86400,
        unit: " s"
    },
    {
        key: "timeout",
        label: "Timeout",
        description: "Seconds a trick-or-treater waits before leaving.",
        kind: SettingKind.Integer,
        emoji: "add",
        min: 10,
        max: 3600,
        unit: " s"
    },
    {
        key: "roleID",
        label: "Champion Role",
        description: "The role given to the Champion of Halloween.",
        kind: SettingKind.Role,
        emoji: "role"
    },
    {
        key: "allowedChannels",
        label: "Allowed Channels",
        description: "Only these channels get trick-or-treaters (empty = all).",
        kind: SettingKind.Channels,
        emoji: "channel"
    },
    {
        key: "ignoredChannels",
        label: "Ignored Channels",
        description: "Channels that never get trick-or-treaters.",
        kind: SettingKind.Channels,
        emoji: "channel"
    },
    {
        key: "ignoredRoles",
        label: "Ignored Roles",
        description: "Members with these roles never summon trick-or-treaters.",
        kind: SettingKind.Roles,
        emoji: "role"
    }
];

/**
 * Describes one configurable guild setting.
 */
export interface SettingDescriptor {
    /**
     * The description shown under the label.
     */
    description: string;

    /**
     * The emoji shown next to the label.
     */
    emoji: EmojiKey;

    /**
     * The settings column this descriptor edits.
     */
    key: keyof GuildSettingsUpdateInput;

    /**
     * The kind of editor used for this setting.
     */
    kind: SettingKind;

    /**
     * The label shown in the overview and modal title.
     */
    label: string;

    /**
     * The maximum allowed value, for integer settings.
     */
    max?: number;

    /**
     * The minimum allowed value, for integer settings.
     */
    min?: number;

    /**
     * Suffix shown after integer values.
     */
    unit?: string;
}

/**
 * Finds a setting by key.
 *
 * @param key The setting key to look up.
 * @returns The matching descriptor, or `undefined` if no setting has that key.
 */
export function getSetting(key: string): SettingDescriptor | undefined {
    return SETTINGS.find((s) => s.key === key);
}

/**
 * Parses user input for an integer setting.
 *
 * @param descriptor The setting being parsed.
 * @param raw The raw text input.
 * @returns The parsed integer.
 * @throws {UserError} If the input is not a whole number within range.
 */
export function parseInteger(descriptor: SettingDescriptor, raw: string): number {
    const value = Number(raw.trim());

    const min = descriptor.min ?? Number.MIN_SAFE_INTEGER;
    const max = descriptor.max ?? Number.MAX_SAFE_INTEGER;
    if (!Number.isInteger(value) || value < min || value > max) {
        throw new UserError(`${descriptor.label} must be a whole number between ${min} and ${max}.`);
    }

    return value;
}

/**
 * Formats the current value of a setting for display.
 *
 * @param descriptor The setting to format.
 * @param settings The guild settings to read the value from.
 * @returns The formatted value, e.g. `"300 s"`, `"<@&id>"`, `"<#a>, <#b>"`, or `"None"`.
 */
export function formatValue(descriptor: SettingDescriptor, settings: GuildSettings): string {
    const value = settings[descriptor.key];
    switch (descriptor.kind) {
        case SettingKind.Integer:
            return `${String(value)}${descriptor.unit ?? ""}`;
        case SettingKind.Role:
            return value === null ? "None" : `<@&${String(value)}>`;
        case SettingKind.Roles:
            return (value as string[]).length === 0 ? "None" : (value as string[]).map((id) => `<@&${id}>`).join(", ");
        case SettingKind.Channels:
            return (value as string[]).length === 0 ? "None" : (value as string[]).map((id) => `<#${id}>`).join(", ");
    }
}
