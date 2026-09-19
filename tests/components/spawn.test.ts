import { ComponentType } from "discord.js";
import { describe, expect, it } from "vitest";
import { createExpiredSpawnMessage, createResolvedSpawnMessage } from "../../src/components/spawn.js";
import { getItemsForMonster, getMonster } from "../../src/utils/data.js";

const monster = getMonster(0);
const image = Buffer.from("png");

describe("createResolvedSpawnMessage", () => {
    it("has no buttons and clears the previous attachment for a new item", () => {
        const item = getItemsForMonster(0)[2]!;
        const payload = createResolvedSpawnMessage({
            monster: monster,
            image: image,
            winnerId: "42",
            item: item,
            duplicate: false,
            candy: 5,
            total: 15
        });
        const container = payload.components[0]!.toJSON();

        expect(container.components[0]!.type).toBe(ComponentType.Section);
        expect(container.components.some((c) => c.type === ComponentType.ActionRow)).toBe(false);
        expect(payload.attachments).toEqual([]);
    });

});

describe("createExpiredSpawnMessage", () => {
    it("drops the image and buttons", () => {
        const payload = createExpiredSpawnMessage();
        const container = payload.components[0]!.toJSON();
        expect(container.components.some((c) => c.type === ComponentType.ActionRow)).toBe(false);
        expect(container.components.some((c) => c.type === ComponentType.MediaGallery)).toBe(false);
        expect(payload.files).toEqual([]);
        expect(payload.attachments).toEqual([]);
    });
});
