import { z } from "zod";

/**
 * The schema used to validate the environment variables.
 */
const schema = z.object({
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_CLIENT_ID: z.string().min(1),
    POSTGRES_URL: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.string().default("info")
});

/**
 * Represents the validated environment variables.
 */
export type Env = z.infer<typeof schema>;

/**
 * Validates the environment variables.
 *
 * @param source The source to read from (defaults to `process.env`).
 * @returns The validated environment.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
    const result = schema.safeParse(source);
    if (!result.success) {
        const issues = result.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ");

        throw new Error(`Invalid environment: ${issues}`);
    }

    return result.data;
}
