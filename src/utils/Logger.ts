import util from "util";

import DailyRotateFile from "winston-daily-rotate-file";
import SentryTransport from "winston-transport-sentry-node";

import { dirname, join } from "path";
import winston, { format } from "winston";

// Constants
export const CONSOLE_FORMAT = format.printf(({ message, level, source, timestamp }) => {
    const cTimestamp = format.colorize().colorize("timestamp", timestamp);
    const cSource = format.colorize().colorize("source", source);
    const cLevel = format.colorize().colorize(level, ` ${level.toUpperCase()} `);

    return `${cTimestamp} ${cLevel} [${cSource}] ${message}`;
});

export const COLORS = {
    timestamp: "gray",
    source: "yellow",
    info: "black cyanBG",
    error: "black redBG",
    warn: "black yellowBG",
    debug: "black greenBG"
};

export const LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

export const TIMESTAMP_FORMAT = format.timestamp({ format: "DD/MM/YYYY HH:mm:ss" });


/**
 * Options for a {@link Logger}.
 */
export interface LoggerOptions {
    /** The folder to save the log files in. */
    directory?: string;

    /** Whether to enable logs in console. */
    enableConsole?: boolean;

    /** Whether to enable debug messages. */
    enableDebug?: boolean;

    /** Whether to save errors. */
    enableError?: boolean;

    /** Wether to save info messages. */
    enableInfo?: boolean;

    /** The name of the error files. */
    errorFilename?: string;

    /** The name of the info files. */
    infoFilename?: string;

    /** The sentry DSN. */
    sentry?: string;
}

/**
 * A wrapper around Winston that allows you to log to the console, files, and Sentry.
 */
export class Logger {
    /** The folder to save the log files in. */
    #directory: string;

    /** Whether to enable logs in console. */
    #enableConsole: boolean;

    /** Whether to enable debug messages. */
    #enableDebug: boolean;

    /** Whether to save errors. */
    #enableError: boolean;

    /** Wether to save info messages. */
    #enableInfo: boolean;

    /** The name of the error files. */
    #errorFilename: string;

    /** The name of the info files. */
    #infoFilename: string;

    /** The winston logger. */
    #logger: winston.Logger;

    /** The sentry DSN. */
    #sentry: string | null;

    /**
     * A wrapper around Winston that allows you to log to the console, files, and Sentry.
     * @param options Options for the logger.
     */
    constructor(options: LoggerOptions = {}) {
        winston.addColors(COLORS);

        this.#directory = options.directory
            || join(dirname(require.main?.filename ?? ""), "logs");

        this.#enableConsole = options.enableConsole ?? true;
        this.#enableDebug = options.enableDebug ?? false;
        this.#enableInfo = options.enableInfo ?? false;
        this.#enableError = options.enableError ?? false;

        this.#infoFilename = options.infoFilename || "info-%DATE%.log";
        this.#errorFilename = options.errorFilename || "error-%DATE%.log";

        this.#sentry = options.sentry || null;

        this.#logger = winston.createLogger({
            handleExceptions: false,
            exitOnError: false,
            transports: this.#transports,
            levels: LEVELS
        });
    }

    /**
     * Returns an array of winston transports.
     * @readonly
     */
    get #transports(): winston.transport[] {
        const arr: winston.transport[] = [];
        if (this.#enableConsole) {
            arr.push(
                new winston.transports.Console({
                    format: winston.format.combine(TIMESTAMP_FORMAT, CONSOLE_FORMAT),
                    level: "debug"
                })
            );
        }

        if (this.#enableInfo) {
            arr.push(
                new DailyRotateFile({
                    filename: join(this.#directory, this.#infoFilename),
                    format: winston.format.combine(TIMESTAMP_FORMAT, winston.format.json()),
                    maxFiles: "14d",
                    level: "info"
                })
            );
        }

        if (this.#enableError) {
            arr.push(
                new DailyRotateFile({
                    filename: join(this.#directory, this.#errorFilename),
                    format: winston.format.combine(TIMESTAMP_FORMAT, winston.format.json()),
                    maxFiles: "14d",
                    level: "warn"
                })
            );
        }

        if (this.#sentry) {
            arr.push(
                // @ts-expect-error FIXME: Broken import?
                new SentryTransport.default({
                    sentry: { dsn: this.#sentry },
                    level: "warn"
                })
            );
        }

        return arr;
    }

    /**
     * Logs a debug message.
     * @param source The source of the log message. This is usually the name of the
     * class or function that is logging the message.
     * @param message The message to log.
     */
    debug(source: string, message: string, ...meta: any[]) {
        if (this.#enableDebug) {
            this.#logger.debug(util.format(message, ...meta), { source });
        }
    }

    /**
     * Logs an error.
     * @param source The source of the error. This is usually the name of the
     * class or function that is logging the error.
     * @param error The error to log.
     */
    error(source: string, error: Error | string, ...meta: any[]) {
        const message = error instanceof Error ? error.message : <string>error;
        const stack = error instanceof Error ? error.stack || error.message : <string>error;

        this.#logger.error(util.format(message, ...meta), { source, stack });
    }

    /**
     * Logs an info message.
     * @param source The source of the log message. This is usually the name of the
     * class or function that is logging the message.
     * @param message The message to log.
     */
    info(source: string, message: string, ...meta: any[]) {
        this.#logger.info(util.format(message, ...meta), { source });
    }

    /**
     * Logs a warning.
     * @param source The source of the warning. This is usually the name of the
     * class or function that is logging the warning.
     * @param message The warning to log.
     */
    warn(source: string, message: string, ...meta: any[]) {
        this.#logger.warn(util.format(message, ...meta), { source });
    }
}
