import type { Env } from "./env.js";

import { createRequire } from "node:module";
import { type Logger, pino } from "pino";

/**
 * Node's CommonJS require, used to probe for optional dependencies.
 */
const require = createRequire(import.meta.url);

/**
 * Creates the application logger.
 *
 * @param env The environment variables.
 * @returns The logger.
 */
export function createLogger(env: Pick<Env, "NODE_ENV" | "LOG_LEVEL">): Logger {
    const wantsPretty = env.NODE_ENV === "development";
    const usePretty = wantsPretty && hasPrettyTransport();

    const logger = pino({
        level: env.LOG_LEVEL,
        transport: usePretty
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined
    });

    if (wantsPretty && !usePretty) {
        logger.warn("pino-pretty is not installed, falling back to plain JSON logs");
    }

    return logger;
}

/**
 * Checks whether `pino-pretty` is installed.
 *
 * @returns Whether `pino-pretty` is installed.
 */
function hasPrettyTransport(): boolean {
    try {
        require.resolve("pino-pretty");
        return true;
    } catch {
        return false;
    }
}
