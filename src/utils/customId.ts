/**
 * Represents a parsed component custom id.
 */
export interface ParsedCustomId {
    /**
     * The action segment (what the handler should do).
     */
    action: string;

    /**
     * Remaining segments.
     */
    args: string[];

    /**
     * The scope segment (which handler owns this id).
     */
    scope: string;
}

/**
 * Builds a custom id of the form `scope:action:arg...`.
 *
 * @param scope The scope segment (which handler owns this id).
 * @param action The action segment (what the handler should do).
 * @param args Remaining segments.
 * @returns The built custom id.
 */
export function buildId(scope: string, action: string, ...args: Array<string | number>): string {
    return [scope, action, ...args.map(String)].join(":");
}

/**
 * Parses a custom id built by {@link buildId}.
 *
 * @param id The custom id to parse.
 * @returns The parsed custom id.
 * @throws {Error} If the id doesn't have at least a scope and an action segment.
 */
export function parseId(id: string): ParsedCustomId {
    const [scope, action, ...args] = id.split(":");
    if (scope === undefined || action === undefined) {
        throw new Error(`Invalid custom id: ${id}`);
    }

    return { scope, action, args };
}
