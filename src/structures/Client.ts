import type { ClientOptions } from "@projectdysnomia/dysnomia";
import type { LoggerOptions } from "../utils/Logger.js";

import { AppDataSource } from "../utils/datasource.js";
import { Client as Dysnomia } from "@projectdysnomia/dysnomia";
import { CommandManager } from "./commands/CommandManager.js";
import { ConfigController } from "../database/controllers/ConfigController.js";
import { EventManager } from "./events/EventManager.js";
import { InventoryController } from "../database/controllers/InventoryController.js";
import { Logger } from "../utils/Logger.js";
import { Collection } from "../utils/Collection.js";

/**
 * Options for a {@link Client}.
 */
interface ExtendedClientOptions extends ClientOptions {
    /** Options for the logger. */
    logger?: LoggerOptions;
}

/**
 * The main class used to interact with the Discord API.
 */
export class Client extends Dysnomia {
    /** Manages message commands and cooldowns. */
    commands = new CommandManager(this);

    /** Controller for config entities. */
    config: ConfigController;

    /** Connection to the database. */
    database = AppDataSource;

    /** Loads all events. */
    events = new EventManager(this);

    /** Controller for inventory items. */
    inventory: InventoryController;

    /** A wrapper around Winston that allows you to log to the console, files, and Sentry. */
    logger: Logger;

    /** Collection with the dates of when the last monster has appeared. */
    lastMonsters = new Collection<number>();

    /**
     * The main class used to interact with the Discord API.
     * @param token The authentication token.
     * @param options Optional options for the client.
     */
    constructor(token: string, options: ExtendedClientOptions = {}) {
        super(token, {
            allowedMentions: {
                everyone: false,
                roles: true,
                users: true
            },
            defaultImageFormat: "png",
            gateway: {
                intents: 513,
                maxShards: "auto"
            },
            restMode: true,
            ...options
        });

        this.setMaxListeners(100);
        this.logger = new Logger({
            directory: "../logs",
            enableError: true,
            enableInfo: true,
            ...options.logger
        });

        this.database.initialize().then(() => {
            this.config = new ConfigController(this);
            this.inventory = new InventoryController(this);
        });

        this.once("ready", () => {
            this.commands.registerCommands();
        });
    }
}
