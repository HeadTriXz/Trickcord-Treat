import type { Logger } from "pino";
import type { Context } from "../context.js";
import type { SpawnGate } from "../core/effects/types.js";
import type { InteractionHandler } from "./router.js";

import { type ButtonInteraction, type Guild, PermissionFlagsBits } from "discord.js";
import { type DoorType, SpawnBlock, formatSpawnBlock, getSpawnBlock, pickSpawn } from "../core/spawner.js";
import { createExpiredSpawnMessage, createResolvedSpawnMessage, createSpawnMessage } from "../components/spawn.js";
import { getMonster, loadMonsterImage } from "../utils/data.js";
import { getChampionChange, resolveGreet } from "../core/greet.js";
import { replyEphemeral } from "./respond.js";
import { UserError } from "../utils/errors.js";
import { config } from "../config.js";

/**
 * Adapts the spawner for effects such as Lure.
 *
 * @param ctx The bot context.
 * @returns The spawn gate.
 */
export function createSpawnGate(ctx: Context): SpawnGate {
    return {
        check: async (guildID, channelID, roleIds) => {
            const settings = await ctx.repositories.settings.getOrCreate(guildID);
            return getSpawnBlock(ctx.spawns, settings, guildID, channelID, roleIds);
        },
        spawn: (guildID, channelID) => postSpawn(ctx, guildID, channelID)
    };
}

/**
 * Posts a trick-or-treater in a channel and schedules its departure.
 *
 * @param ctx The bot context.
 * @param guildID The ID of the guild.
 * @param channelID The channel to post in.
 * @throws {UserError} If a spawn is already active or the bot cannot post in the channel.
 */
export async function postSpawn(ctx: Context, guildID: string, channelID: string): Promise<void> {
    if (!ctx.spawns.reserve(guildID)) {
        throw new UserError(formatSpawnBlock(SpawnBlock.Active));
    }

    try {
        const channel = await ctx.client.channels.fetch(channelID);
        if (channel === null || !channel.isSendable()) {
            throw new Error(`Channel ${channelID} is not sendable.`);
        }

        if (!channel.isDMBased()) {
            const permissions = channel.permissionsFor(ctx.client.user);
            const required = [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles
            ];

            if (permissions?.has(required) !== true) {
                throw new UserError("I can't post in this channel.");
            }
        }

        const settings = await ctx.repositories.settings.getOrCreate(guildID);
        const { monster, type } = pickSpawn();
        const image = await loadMonsterImage(monster);
        const message = await channel.send(createSpawnMessage({ monster, type, image }));

        const timer = setTimeout(() => {
            if (ctx.spawns.get(guildID)?.messageID !== message.id) {
                return;
            }

            const spawn = ctx.spawns.take(guildID);
            if (spawn === undefined) {
                return;
            }

            channel.messages.edit(spawn.messageID, createExpiredSpawnMessage())
                .catch((error: unknown) => ctx.logger.warn(error, "Failed to expire spawn"));
        }, settings.timeout * 1000);

        const expiresAt = Date.now() + settings.timeout * 1000;
        ctx.spawns.set(guildID, {
            channelID: channelID,
            messageID: message.id,
            monsterID: monster.id,
            type: type,
            expiresAt: expiresAt,
            timer: timer
        });
    } finally {
        ctx.spawns.release(guildID);
    }
}

/**
 * Handles the Trick/Treat buttons.
 */
export const spawnHandler: InteractionHandler = {
    scope: "spawn",
    execute: async (ctx, interaction, id) => {
        if (!interaction.inCachedGuild() || !("message" in interaction)) {
            return;
        }

        const button = interaction as ButtonInteraction<"cached">;
        const type = id.action as DoorType;
        const spawn = ctx.spawns.get(button.guildId);
        if (spawn === undefined || spawn.messageID !== button.message.id) {
            return replyEphemeral(button, `${config.emojis.error} There is no one knockin' on your door.`);
        }

        if (spawn.type !== type) {
            await ctx.repositories.members.addCandy(button.guildId, button.user.id, config.candy.scare);
            return replyEphemeral(button, `${config.emojis.error} You scared them, but they're still waiting…`);
        }

        const taken = ctx.spawns.take(button.guildId);
        if (taken === undefined || taken.messageID !== button.message.id) {
            return replyEphemeral(button, `${config.emojis.error} There is no one knockin' on your door.`);
        }

        try {
            await button.deferUpdate();

            const before = await ctx.repositories.inventory.getTop(button.guildId);
            const result = await resolveGreet(
                { db: ctx.db, effects: ctx.effects },
                { guildID: button.guildId, userID: button.user.id, monsterID: taken.monsterID }
            );
            const monster = getMonster(taken.monsterID);
            const image = await loadMonsterImage(monster);

            await button.editReply(createResolvedSpawnMessage({
                monster: monster,
                image: image,
                winnerId: button.user.id,
                item: result.item,
                duplicate: result.duplicate,
                candy: result.candy,
                total: result.total
            }));

            if (result.collectedAll) {
                await replyEphemeral(button, `${config.emojis.check} Congratulations! You have collected all items.`);
            }

            if (result.duplicate) {
                return;
            }

            const settings = await ctx.repositories.settings.getOrCreate(button.guildId);
            const change = getChampionChange(before, await ctx.repositories.inventory.getTop(button.guildId));
            if (settings.roleID === null || change === null) {
                return;
            }

            await Promise.all([
                setChampionRole(button.guild, "addRole", change.newChampion, settings.roleID, ctx.logger),
                change.previous === undefined
                    ? undefined
                    : setChampionRole(button.guild, "removeRole", change.previous, settings.roleID, ctx.logger)
            ]);
        } catch (error) {
            await button.message.edit(createExpiredSpawnMessage())
                .catch((editError: unknown) => ctx.logger.warn({ err: editError }, "Failed to expire spawn after error"));
            throw error;
        }
    }
};

/**
 * Adds or removes the champion role for a member, warning on failure without throwing.
 *
 * @param guild The guild to change the role in.
 * @param method Whether to add or remove the role.
 * @param userID The ID of the member.
 * @param roleID The ID of the champion role.
 * @param logger The logger to warn on failure.
 */
async function setChampionRole(
    guild: Guild,
    method: "addRole" | "removeRole",
    userID: string,
    roleID: string,
    logger: Logger
): Promise<void> {
    await guild.members[method]({ user: userID, role: roleID }).catch((error: unknown) => logger.warn(
        { err: error, guildID: guild.id, userID: userID },
        `Failed to ${method === "addRole" ? "add" : "remove"} champion role`
    ));
}
