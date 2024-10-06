import {
    type AnyInteraction,
    type ConstructorArray,
    type Gateway,
    type Module,
    Client,
    ValidationError
} from "@barry-bot/core";
import { type GatewayIntentBits, API, MessageFlags } from "@discordjs/core";
import { type GuildSettings, PrismaClient } from "@prisma/client";
import type { BaseLogger } from "@barry-bot/logger";
import type { CurrentMonster } from "./common.js";
import type { ModuleWithSettings } from "./config/types.js";

import {
    ChannelArrayGuildSettingOption,
    IntegerGuildSettingOption,
    RoleArrayGuildSettingOption,
    RoleGuildSettingOption
} from "./config/options/index.js";
import { loadCommands, loadEvents } from "./utils/loadFolder.js";
import { ConfigurableModule } from "./config/module.js";
import { GuildSettingsRepository } from "./database/GuildSettingsRepository.js";
import { InventoryItemRepository } from "./database/InventoryItemRepository.js";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import config from "./config.js";

/**
 * Options for an {@link Application}.
 */
export interface ApplicationOptions {
    /**
     * Discord-related configurations for the application.
     */
    discord: ApplicationDiscordOptions;

    /**
     * The logger used for logging messages.
     */
    logger?: BaseLogger;

    /**
     * An array of module classes to be added to the client.
     */
    modules: ConstructorArray<Module>;
}

export interface ApplicationDiscordOptions {
    /**
     * The ID of the application.
     */
    applicationID: string;

    /**
     * The intents to be used for the gateway.
     */
    intents: GatewayIntentBits;

    /**
     * The token to use for authorization.
     */
    token: string;
}

/**
 * Represents the main client for Trick'cord Treat.
 */
export class Application extends Client {
    /**
     * The gateway connection for receiving and sending real-time events.
     */
    declare gateway: Gateway;

    /**
     * The Prisma client used for interacting with the database.
     */
    prisma: PrismaClient = new PrismaClient();

    /**
     * Represents the main client for Trick'cord Treat.
     *
     * @param options Options for the client.
     */
    constructor(options: ApplicationOptions) {
        const rest = new REST().setToken(options.discord.token);

        super({
            api: new API(rest),
            applicationID: options.discord.applicationID,
            gateway: new WebSocketManager({
                intents: options.discord.intents,
                rest: rest,
                token: options.discord.token
            }),
            logger: options.logger,
            modules: options.modules
        });

        this.setMaxListeners(200);
    }

    /**
     * Initializes the client.
     */
    override async initialize(): Promise<void> {
        await super.initialize();

        await this.commands.sync();
        await this.gateway.connect();
    }
}

/**
 * Represents the main module for the bot.
 */
export class MainModule extends ConfigurableModule<MainModule> implements ModuleWithSettings<GuildSettings> {   
    /**
     * A map with the current monsters in each channel.
     */
    currentMonsters: Map<string, CurrentMonster> = new Map();

    /**
     * Repository class for managing inventory items.
     */
    inventory: InventoryItemRepository;

    /**
     * A map with the dates of when the last monster has appeared.
     */
    lastMonsters: Map<string, number> = new Map();

    /**
     * Repository class for managing guild settings.
     */
    settings: GuildSettingsRepository;

    /**
     * Represents the main module for the bot.
     *
     * @param client The client that initialized the module.
     */
    constructor(client: Application) {
        super(client, {
            id: "main",
            name: "General",
            description: "The main functionality of the bot.",
            commands: loadCommands("./commands"),
            events: loadEvents("./events")
        });

        this.inventory = new InventoryItemRepository(client.prisma);
        this.settings = new GuildSettingsRepository(client.prisma);

        this.defineConfig({
            settings: {
                chance: new IntegerGuildSettingOption({
                    name: "Chance",
                    description: "The chance of the bot responding to messages (in percentage).",
                    maximum: 100,
                    minimum: 0
                }),
                interval: new IntegerGuildSettingOption({
                    name: "Interval",
                    description: "How long the bot waits before responding to messages again (in seconds).",
                    maximum: 86400,
                    minimum: 60
                }),
                timeout: new IntegerGuildSettingOption({
                    name: "Timeout",
                    description: "How long the monsters will stay in the channel before disappearing (in seconds).",
                    maximum: 3600,
                    minimum: 10
                }),
                roleID: new RoleGuildSettingOption({
                    name: "Role Reward",
                    description: "The role that will be given to the champion of Halloween."
                }),
                allowedChannels: new ChannelArrayGuildSettingOption({
                    name: "Allowed Channels",
                    description: "The channels where the bot can be used.",
                }),
                ignoredChannels: new ChannelArrayGuildSettingOption({
                    name: "Ignored Channels",
                    description: "The channels where the bot will not respond to messages.",
                }),
                ignoredRoles: new RoleArrayGuildSettingOption({
                    name: "Ignored Roles",
                    description: "The roles that the bot will not respond to.",
                })
            }
        });

        this.client.interactions.addMiddleware(async (interaction, next) => {
            try {
                await next();
            } catch (error: unknown) {
                if (error instanceof ValidationError) {
                    return this.#handleValidationError(interaction, error);
                }

                this.client.logger.error(error);
            }
        });

        setInterval(() => this.#checkExpired(), 1000);
    }

    /**
     * Checks if the guild has enabled this module.
     * 
     * @returns Whether the guild has enabled this module.
     */
    isEnabled(): boolean {
        return true;
    }

    /**
     * Checks if the monsters have expired and removes them if they have.
     */
    async #checkExpired(): Promise<void> {
        for (const [guildID, monster] of this.currentMonsters) {
            if (monster.expiresAt > Date.now()) {
                continue;
            }

            this.currentMonsters.delete(guildID);
            await this.client.api.channels.editMessage(monster.channelID, monster.messageID, {
                attachments: [],
                embeds: [{
                    title: "The trick-or-treater disappeared...",
                    description: "No one noticed them and they left :(",
                    color: config.defaultColor
                }]
            });
        }
    }

    /**
     * Handles the validation error by sending an ephemeral message.
     *
     * @param interaction The interaction that triggered the error.
     * @param error The error that occurred.
     */
    async #handleValidationError(interaction: AnyInteraction, error: ValidationError): Promise<void> {
        const isReplyable = interaction.isApplicationCommand()
        || interaction.isMessageComponent()
        || interaction.isModalSubmit();

        if (isReplyable) {
            return interaction.createMessage({
                content: `${config.emotes.error} ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (interaction.isAutocomplete()) {
            return interaction.result([{
                name: error.message,
                value: "error"
            }]);
        }
    }
}
