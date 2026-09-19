import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

import rawItems from "../../assets/items.json" with { type: "json" };
import rawMonsters from "../../assets/monsters.json" with { type: "json" };

/**
 * The rarity of an item.
 */
export enum ItemRarity {
    Common = 0,
    Uncommon = 1,
    Rare = 2
}

const itemSchema = z.object({
    id: z.number().int(),
    parent_id: z.number().int(),
    name: z.string().min(1),
    rarity: z.enum(ItemRarity)
});

const monsterSchema = z.object({
    id: z.number().int(),
    name: z.string().min(1),
    image_path: z.string().min(1)
});

/**
 * Represents a collectible item.
 */
export interface Item {
    /**
     * The item's ID.
     */
    id: number;

    /**
     * The item's display name.
     */
    name: string;

    /**
     * The ID of the monster this item belongs to.
     */
    parentID: number;

    /**
     * The item's rarity.
     */
    rarity: ItemRarity;
}

/**
 * Represents a trick-or-treater.
 */
export interface Monster {
    /**
     * The monster's ID.
     */
    id: number;

    /**
     * Path to the monster's spawn image, relative to the project root.
     */
    imagePath: string;

    /**
     * The monster's display name.
     */
    name: string;
}

/**
 * All collectible items, validated from assets/items.json.
 */
export const items: readonly Item[] = z.array(itemSchema).parse(rawItems)
    .map((i) => ({ id: i.id, parentID: i.parent_id, name: i.name, rarity: i.rarity }));

/**
 * All trick-or-treaters, validated from assets/monsters.json.
 */
export const monsters: readonly Monster[] = z.array(monsterSchema).parse(rawMonsters)
    .map((m) => ({ id: m.id, name: m.name, imagePath: m.image_path }));

/**
 * The total amount of collectible items.
 */
export const TOTAL_ITEMS = items.length;

const monsterById = new Map(monsters.map((m) => [m.id, m]));
const itemsByMonster = new Map<number, Item[]>();
for (const item of items) {
    const list = itemsByMonster.get(item.parentID) ?? [];
    list.push(item);
    itemsByMonster.set(item.parentID, list);
}

const itemsByRarity = new Map<ItemRarity, Item[]>();
for (const item of items) {
    const list = itemsByRarity.get(item.rarity) ?? [];
    list.push(item);
    itemsByRarity.set(item.rarity, list);
}

const imageCache = new Map<number, Buffer>();

/**
 * Returns the monster with the given ID.
 *
 * @param id The ID of the monster.
 * @returns The matching monster.
 * @throws {Error} If no monster has that ID.
 */
export function getMonster(id: number): Monster {
    const monster = monsterById.get(id);
    if (monster === undefined) {
        throw new Error(`Monster with ID ${id} does not exist.`);
    }

    return monster;
}

/**
 * Returns the items belonging to a monster (one per rarity).
 *
 * @param monsterID The ID of the monster.
 * @returns The monster's items.
 */
export function getItemsForMonster(monsterID: number): Item[] {
    return [...(itemsByMonster.get(monsterID) ?? [])];
}

/**
 * Returns the items of a given rarity.
 *
 * @param rarity The rarity to look up.
 * @returns The items of that rarity.
 */
export function getItemsByRarity(rarity: ItemRarity): Item[] {
    return [...(itemsByRarity.get(rarity) ?? [])];
}

/**
 * Reads (and caches) the image for a monster.
 *
 * @param monster The monster whose image to load.
 * @returns The image data.
 */
export async function loadMonsterImage(monster: Monster): Promise<Buffer> {
    const cached = imageCache.get(monster.id);
    if (cached !== undefined) {
        return cached;
    }

    const buffer = await readFile(join(process.cwd(), monster.imagePath));
    imageCache.set(monster.id, buffer);
    return buffer;
}
