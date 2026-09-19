/**
 * Represents an error whose message is safe to show to the user.
 */
export class UserError extends Error {
    /**
     * Represents an error whose message is safe to show to the user.
     *
     * @param message The user-facing message.
     */
    constructor(message: string) {
        super(message);
        this.name = "UserError";
    }
}
