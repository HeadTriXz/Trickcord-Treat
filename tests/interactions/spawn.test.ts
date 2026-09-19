import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { ComponentType } from "discord.js";
import { createTestDatabase } from "../helpers/database.js";
import { createRepositories } from "../../src/database/repositories/index.js";
import { spawnHandler } from "../../src/interactions/spawn.js";
import { DoorType } from "../../src/core/spawner.js";
import { makeContext } from "../helpers/context.js";
import type { Context } from "../../src/context.js";
import type { Database } from "../../src/database/client.js";

/**
 * Represents a fake role change call.
 */
interface RoleChange {
    role: string;
    user: string;
}

/**
 * Represents a fake button interaction, typed enough to assert on.
 */
interface FakeInteraction {
    channelId: string;
    deferUpdate: Mock<() => Promise<void>>;
    deferred: boolean;
    editReply: Mock<(payload: unknown) => Promise<void>>;
    followUp: Mock<(payload: unknown) => Promise<void>>;
    guild: {
        members: {
            addRole: Mock<(input: RoleChange) => Promise<void>>;
            removeRole: Mock<(input: RoleChange) => Promise<void>>;
        };
    };
    guildId: string;
    inCachedGuild: () => true;
    member: { roles: { cache: Map<string, unknown> } };
    message: { edit: Mock<(payload: unknown) => Promise<void>>; id: string };
    replied: boolean;
    reply: Mock<(payload: unknown) => Promise<void>>;
    user: { id: string };
}

let db: Database;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDatabase()));
afterAll(() => close());

function makeCtx(): Context {
    return makeContext({ db: db, repositories: createRepositories(db) });
}

/**
 * Creates a fake button interaction for the spawn handler.
 */
function makeInteraction(messageID: string, userID = "u"): FakeInteraction {
    return {
        inCachedGuild: () => true,
        guildId: "g",
        channelId: "c",
        user: { id: userID },
        member: { roles: { cache: new Map() } },
        message: { id: messageID, edit: vi.fn<(payload: unknown) => Promise<void>>().mockResolvedValue(undefined) },
        guild: {
            members: {
                addRole: vi.fn<(input: RoleChange) => Promise<void>>().mockResolvedValue(undefined),
                removeRole: vi.fn<(input: RoleChange) => Promise<void>>().mockResolvedValue(undefined)
            }
        },
        deferred: false,
        replied: false,
        reply: vi.fn<(payload: unknown) => Promise<void>>().mockResolvedValue(undefined),
        followUp: vi.fn<(payload: unknown) => Promise<void>>().mockResolvedValue(undefined),
        deferUpdate: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        editReply: vi.fn<(payload: unknown) => Promise<void>>().mockResolvedValue(undefined)
    };
}

describe("spawnHandler", () => {
    it("tells users when nobody is at the door", async () => {
        const ctx = makeCtx();
        const interaction = makeInteraction("m1");
        await spawnHandler.execute(ctx, interaction as never, { scope: "spawn", action: "treat", args: [] });
        expect(interaction.reply).toHaveBeenCalledTimes(1);
        const payload = interaction.reply.mock.calls[0]![0] as { components: unknown[] };
        expect(payload.components).toBeInstanceOf(Array);
        expect(JSON.stringify(interaction.reply.mock.calls[0])).toContain("no one knockin");
    });

    it("penalises the wrong button and keeps the spawn", async () => {
        const ctx = makeCtx();
        await ctx.repositories.members.addCandy("g", "u", 5);
        ctx.spawns.set("g", { channelID: "c", messageID: "m2", monsterID: 0, type: DoorType.Treat, expiresAt: 0, timer: setTimeout(() => undefined, 0) });

        const interaction = makeInteraction("m2");
        await spawnHandler.execute(ctx, interaction as never, { scope: "spawn", action: "trick", args: [] });
        expect(JSON.stringify(interaction.reply.mock.calls[0])).toContain("scared them");
        expect((await ctx.repositories.members.getOrCreate("g", "u")).candy).toBe(2);
        expect(ctx.spawns.get("g")).toBeDefined();
    });

    it("resolves the right button, edits the message and crowns the champion", async () => {
        const ctx = makeCtx();
        await ctx.repositories.settings.update("g", { roleID: "champ" });
        ctx.spawns.set("g", { channelID: "c", messageID: "m3", monsterID: 0, type: DoorType.Treat, expiresAt: 0, timer: setTimeout(() => undefined, 0) });

        const interaction = makeInteraction("m3");
        await spawnHandler.execute(ctx, interaction as never, { scope: "spawn", action: "treat", args: [] });

        expect(interaction.deferUpdate).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({ attachments: [] }));
        expect(ctx.spawns.get("g")).toBeUndefined();
        expect(await ctx.repositories.inventory.getByUser("g", "u")).toHaveLength(1);
        expect(interaction.guild.members.addRole).toHaveBeenCalledWith({ user: "u", role: "champ" });
    });

    it("expires the spawn message and rethrows when resolving fails after take()", async () => {
        const ctx = makeCtx();
        ctx.spawns.set("g", { channelID: "c", messageID: "m4", monsterID: 0, type: DoorType.Treat, expiresAt: 0, timer: setTimeout(() => undefined, 0) });

        const interaction = makeInteraction("m4");
        interaction.editReply.mockRejectedValueOnce(new Error("editReply failed"));

        await expect(spawnHandler.execute(ctx, interaction as never, { scope: "spawn", action: "treat", args: [] }))
            .rejects.toThrow("editReply failed");

        expect(interaction.message.edit).toHaveBeenCalledTimes(1);
        const payload = interaction.message.edit.mock.calls[0]![0] as {
            components: Array<{ toJSON(): { components?: Array<{ type: ComponentType }> } }>;
        };
        const container = payload.components[0]!.toJSON();
        expect(container.components?.some((c) => c.type === ComponentType.ActionRow)).toBe(false);
    });
});
