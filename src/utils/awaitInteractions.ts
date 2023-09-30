import type { AnyInteractionGateway, ComponentInteraction } from "@projectdysnomia/dysnomia";
import type Dysnomia from "@projectdysnomia/dysnomia";

import { Message } from "@projectdysnomia/dysnomia";
import { EventEmitter } from "events";

/**
 * Options for the {@link InteractionCollector}.
 */
interface CollectorOptions {
    /** Time in milliseconds that the collector will wait for interactions. */
    time: number;

    /** Maximum amount of interactions the collector will collect. */
    maxMatches: number;
}

type Filter<T extends AnyInteractionGateway> = (data: T, userID: string) => boolean;

const collectors: InteractionCollector[] = [];

/**
 * Collects interactions from a user and emits an event when it's done.
 */
class InteractionCollector<T extends AnyInteractionGateway = AnyInteractionGateway> extends EventEmitter {
    /** An array with collected interactions. */
    collected: T[] = [];

    /** Whether the collector is done collecting. */
    ended = false;

    /**
     * Collects interactions from a user and emits an event when it's done.
     * @param filter The filter to use to determine if the interaction should be collected.
     * @param options Options for the collector.
     * @param message The message to collect interactions for ({@link ComponentInteraction} only).
     */
    constructor(
        public filter: Filter<T>,
        public options: CollectorOptions,
        public message: T extends ComponentInteraction ? Message : never
    ) {
        super();

        collectors.push(this as any);
        setTimeout(() => this.stopListening("time"), options.time);
    }

    /**
     * Returns whether the interaction should be collected.
     * @param interaction The interaction to check.
     */
    check(interaction: T): boolean {
        if (this.message) {
            if (interaction.type === 3 && this.message.id !== interaction.message.id) {
                return false;
            }

            if (interaction.type === 5) {
                return false;
            }
        }

        const userID = interaction.member?.id
            ?? interaction.user!.id;

        if (this.filter(interaction, userID)) {
            this.collected.push(interaction);
            this.emit("interactionCreate", interaction);

            if (this.collected.length >= this.options.maxMatches) {
                this.stopListening("maxMatches");
            }

            return true;
        }

        return false;
    }

    /**
     * Stop listening for new interactions.
     * @param reason The reason to stop listening.
     */
    stopListening(reason: "time" | "maxMatches" | "user"): void {
        if (!this.ended) {
            this.ended = true;

            collectors.splice(collectors.indexOf(this as any), 1);
            this.emit("end", this.collected, reason);
        }
    }
}

// Don't even bother looking at this mess (╯°□°）╯︵ ┻━┻

let listening = false;
Message.prototype.awaitInteractions = function(
    filter: Filter<ComponentInteraction>,
    options: CollectorOptions
): Promise<ComponentInteraction[]> {
    if (!listening) {
        (this as any)._client.on("interactionCreate", (interaction: AnyInteractionGateway) => {
            for (const collector of collectors) {
                collector.check(interaction);
            }
        });

        listening = true;
    }

    const collector = new InteractionCollector(filter, options, this);
    return new Promise((resolve) => collector.on("end", resolve));
};

declare module "@projectdysnomia/dysnomia" {
    interface Message {
        awaitInteractions(
            filter: Filter<Dysnomia.ComponentInteraction>,
            options: CollectorOptions
        ): Promise<Dysnomia.ComponentInteraction[]>;
    }
}
