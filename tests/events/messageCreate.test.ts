import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Message } from "discord.js";
import { onMessage } from "../../src/events/messageCreate.js";
import { postSpawn } from "../../src/interactions/spawn.js";
import { SpawnStore } from "../../src/core/spawner.js";
import { makeContext } from "../helpers/context.js";
import { makeSettings } from "../helpers/settings.js";
import type { Context } from "../../src/context.js";

vi.mock("../../src/interactions/spawn.js", () => ({
    postSpawn: vi.fn().mockResolvedValue(undefined)
}));

const settings = makeSettings({ chance: 100 });

/**
 * Creates a fake context with a settings repo stub and the given spawn store.
 */
function makeCtx(spawns: SpawnStore): Context {
    return makeContext({
        repositories: {
            settings: { getOrCreate: vi.fn().mockResolvedValue(settings) }
        } as never,
        spawns: spawns
    });
}

/**
 * Creates a fake message, typed enough for `onMessage`.
 */
function makeMessage(overrides: { bot?: boolean } = {}): Message {
    return {
        inGuild: () => true,
        guildId: "g",
        channelId: "c",
        author: { bot: overrides.bot ?? false },
        member: { roles: { cache: new Map() } }
    } as unknown as Message;
}

describe("onMessage", () => {
    beforeEach(() => {
        vi.mocked(postSpawn).mockClear();
    });

    it("does not spawn for a bot author", async () => {
        const ctx = makeCtx(new SpawnStore());
        await onMessage(ctx, makeMessage({ bot: true }));
        expect(postSpawn).not.toHaveBeenCalled();
    });

    it("does not spawn when the guild already has a reservation", async () => {
        const spawns = new SpawnStore();
        spawns.reserve("g");

        const ctx = makeCtx(spawns);
        await onMessage(ctx, makeMessage());
        expect(postSpawn).not.toHaveBeenCalled();
    });

    it("posts a spawn otherwise", async () => {
        const ctx = makeCtx(new SpawnStore());
        await onMessage(ctx, makeMessage());
        expect(postSpawn).toHaveBeenCalledTimes(1);
        expect(postSpawn).toHaveBeenCalledWith(ctx, "g", "c");
    });
});
