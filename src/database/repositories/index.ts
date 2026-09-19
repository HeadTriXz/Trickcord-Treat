import type { Database } from "../client.js";

import { ActiveEffectsRepository } from "./ActiveEffectsRepository.js";
import { InventoryRepository } from "./InventoryRepository.js";
import { MembersRepository } from "./MembersRepository.js";
import { SettingsRepository } from "./SettingsRepository.js";

/**
 * Represents all repositories bound to one database handle.
 */
export interface Repositories {
    /**
     * Repository for purchased effects.
     */
    activeEffects: ActiveEffectsRepository;

    /**
     * Repository for collected items.
     */
    inventory: InventoryRepository;

    /**
     * Repository for members and their candy balance.
     */
    members: MembersRepository;

    /**
     * Repository for guild settings.
     */
    settings: SettingsRepository;
}

/**
 * Creates repositories for a database or transaction handle.
 *
 * @param db The database or transaction handle.
 * @returns The bound repositories.
 */
export function createRepositories(db: Database): Repositories {
    return {
        settings: new SettingsRepository(db),
        members: new MembersRepository(db),
        inventory: new InventoryRepository(db),
        activeEffects: new ActiveEffectsRepository(db)
    };
}

export { ActiveEffectsRepository, InventoryRepository, MembersRepository, SettingsRepository };
export type { LeaderboardEntry } from "./InventoryRepository.js";
export type { GuildSettingsUpdateInput } from "./SettingsRepository.js";
