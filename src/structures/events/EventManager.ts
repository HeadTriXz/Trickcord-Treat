import type { Client } from "../Client.js";
import type { ClientEvents } from "eris";
import type { Event } from "./Event.js";

import fs from "fs/promises";

export type Listener<
    K extends keyof ClientEvents = keyof ClientEvents
> = (...args: ClientEvents[K]) => void | Promise<void>;

/**
 * Loads all events.
 */
export class EventManager {
    /**
     * Loads all events.
     * @param client The client that initialized the event manager.
     */
    constructor(public client: Client) {
        this.loadEvents("./events/").catch((err) => {
            this.client.logger.error("EventManager", err);
        });
    }

    /**
     * Loads all the events in a folder and registers them to the client.
     * @param path The folder that contains the events.
     */
    async loadEvents(path: string): Promise<void> {
        const entries = await fs.readdir(path, { withFileTypes: true });
        if (!entries) return;

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                if (!entry.name.endsWith(".js")) {
                    continue;
                }

                const EventClass = ((r) => r.default || r)(await import(`../.${path}${entry.name}`));
                if (Object.getPrototypeOf(EventClass)?.name !== "Event") {
                    return this.client.logger.error("EventManager", "You must inherit the \"Event\" class");
                }

                const event: Event = new EventClass(this.client);
                const listener = event.execute.bind(event);

                this.client.on(event.name, listener);
            } else {
                await this.loadEvents(`${path}${entry.name}/`);
            }
        }
    }
}
