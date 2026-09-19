import type { Context } from "../../src/context.js";

import { vi } from "vitest";
import { effects } from "../../src/core/effects/index.js";
import { SpawnStore } from "../../src/core/spawner.js";

/**
 * Builds a fake bot context for tests, with a shared fake logger and client.
 *
 * @param overrides Fields to override.
 * @returns The context object.
 */
export function makeContext(overrides: Partial<Context> = {}): Context {
    return {
        client: {} as never,
        db: {} as never,
        repositories: {} as never,
        effects: effects,
        spawns: new SpawnStore(),
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never,
        ...overrides
    };
}
