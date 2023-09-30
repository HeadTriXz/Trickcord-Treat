import type { ClientEvents } from "@projectdysnomia/dysnomia";
import type { Client } from "../Client.js";

export type Emittable = keyof ClientEvents;

/**
 * Represents an event.
 * @abstract
 */
export abstract class Event<E extends Emittable = Emittable> {
    /** The client that initialized the event. */
    client: Client;

    /** The name of the event. */
    name: E;

    /**
     * Represents an event.
     * @param client The client that initialized the event.
     * @param name The name of the event.
     */
    constructor(client: Client, name: E) {
        this.client = client;
        this.name = name;
    }

    abstract execute(...args: ClientEvents[E]): Promise<void>;
}
