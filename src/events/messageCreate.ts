import {
    type GatewayMessageCreateDispatchData,
    GatewayDispatchEvents
} from "@discordjs/core";
import type { GuildSettings } from "@prisma/client";
import type { MainModule } from "../main.js";

import { Event } from "@barry-bot/core";
import { OpenDoorType } from "../common.js";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

import config from "../config.js";
import monsters from "../../assets/monsters.json" with { type: "json" };

/**
 * An event that watches for messages and gives users a random item.
 */
export default class extends Event<MainModule> {
    #images: Map<number, Buffer> = new Map();

    /**
     * An event that watches for messages and gives users a random item.
     *
     * @param module The module the event belongs to. 
     */
    constructor(module: MainModule) {
        super(module, GatewayDispatchEvents.MessageCreate);

        this.#loadImages().catch((error) => {
            this.client.logger.fatal("Failed to load images for monsters", error);
        });
    }

    /**
     * Give a random item to the user if they meet the requirements.
     *
     * @param message The message that was created.
     */
    async execute(message: GatewayMessageCreateDispatchData): Promise<void> {
        if (message.guild_id === undefined || message.author.bot) {
            return;
        }

        const settings = await this.module.settings.getOrCreate(message.guild_id);
        if (Math.random() > settings.chance / 100) {
            return;
        }

        if (!this.#isAllowed(message, settings)) {
            return;
        }

        const lastSeen = this.module.lastMonsters.get(message.guild_id);
        if (lastSeen !== undefined && Date.now() - lastSeen < settings.interval * 1000) {
            return;
        }

        await this.spawnMonster(message.guild_id, message.channel_id, settings.timeout);
    }

    /**
     * Spawn a monster in the specified channel.
     *
     * @param guildID The ID of the guild.
     * @param channelID The ID of the channel.
     * @param timeout The timeout for the monster (in seconds).
     */
    async spawnMonster(guildID: string, channelID: string, timeout: number): Promise<void> {
        this.module.lastMonsters.set(guildID, Date.now());

        const monster = monsters[Math.floor(Math.random() * monsters.length)];

        const image = this.#images.get(monster.id);
        if (image === undefined) {
            throw new Error(`Image for monster with ID ${monster.id} not found.`);
        }

        const responseType = Math.random() < 0.5
            ? OpenDoorType.Trick
            : OpenDoorType.Treat;

        const message = await this.client.api.channels.createMessage(channelID, {
            embeds: [{
                title: "A trick-or-treater has stopped by!",
                description: `Open the door and greet them with \`/${responseType}\``,
                image: {
                    url: `attachment://${monster.id}.png`
                },
                color: config.defaultColor
            }],
            files: [{
                name: `${monster.id}.png`,
                data: image
            }]
        });

        this.module.currentMonsters.set(guildID, {
            channelID: channelID,
            expiresAt: Date.now() + (timeout * 1000),
            messageID: message.id,
            monsterID: monster.id,
            type: responseType
        });
    }

    /**
     * Check if the message is allowed to be processed.
     *
     * @param message The message to check.
     * @param settings The settings of the guild.
     * @returns Whether the message is allowed to be processed.
     */
    #isAllowed(message: GatewayMessageCreateDispatchData, settings: GuildSettings): boolean {
        if (settings.allowedChannels.length > 0 && !settings.allowedChannels.includes(message.channel_id)) {
            return false;
        }

        if (settings.ignoredChannels.includes(message.channel_id)) {
            return false;
        }

        if (settings.ignoredRoles.some((roleID) => message.member?.roles.includes(roleID))) {
            return false;
        }

        return true;
    }

    async #loadImages(): Promise<void> {
        for (const monster of monsters) {
            const buffer = await readFile(join(process.cwd(), monster.image_path));
            this.#images.set(monster.id, buffer);
        }
    }
}
