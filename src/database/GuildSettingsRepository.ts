import type { GuildSettings, Prisma, PrismaClient } from "@prisma/client";
import type { SettingsRepository } from "../config/types.js";

/**
 * Repository class for managing guild settings.
 */
export class GuildSettingsRepository implements SettingsRepository<GuildSettings> {
    /**
     * The Prisma client used to interact with the database.
     */
    #prisma: PrismaClient;

    /**
     * Repository class for managing guild settings.
     *
     * @param prisma The Prisma client used to interact with the database.
     */
    constructor(prisma: PrismaClient) {
        this.#prisma = prisma;
    }

    /**
     * If a record exists for the specified guild, return it, otherwise create a new one.
     *
     * @param guildID The ID of the guild.
     * @returns The guild settings record.
     */
    async getOrCreate(guildID: string): Promise<GuildSettings> {
        return this.#prisma.guildSettings.upsert({
            create: { guildID },
            update: {},
            where: { guildID }
        });
    }

    /**
     * Upserts the settings for the specified guild.
     *
     * @param guildID The ID of the guild. 
     * @param settings The settings to update.
     * @returns The updated guild settings record.
     */
    async upsert(guildID: string, settings: Omit<Prisma.GuildSettingsCreateInput, "guildID">): Promise<GuildSettings> {
        return this.#prisma.guildSettings.upsert({
            create: { ...settings, guildID },
            update: settings,
            where: { guildID }
        });
    }
}
