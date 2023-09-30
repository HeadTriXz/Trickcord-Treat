// TIME
const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const YEAR = DAY * 365;

// REGEX
// eslint-disable-next-line max-len
const REGEX = /((?:\d+)?\.?\d+)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)/ig;

/**
 * Convert a human-readable string to seconds.
 * @param value The provided value. E.g.: `2h`, `2h30m`, and `2 hours`.
 */
export function getDuration(value: string): number {
    let result = 0;
    let match: RegExpExecArray | null;
    while ((match = REGEX.exec(value)) !== null) {
        const n = parseInt(match[1]);
        switch (match[2].toLowerCase()) {
            case "years":
            case "year":
            case "yrs":
            case "yr":
            case "y": {
                result += n * YEAR;
                break;
            }

            case "weeks":
            case "week":
            case "w": {
                result += n * WEEK;
                break;
            }

            case "days":
            case "day":
            case "d": {
                result += n * DAY;
                break;
            }

            case "hours":
            case "hour":
            case "hrs":
            case "hr":
            case "h": {
                result += n * HOUR;
                break;
            }

            default:
            case "minutes":
            case "minute":
            case "mins":
            case "min":
            case "m": {
                result += n * MINUTE;
                break;
            }

            case "seconds":
            case "second":
            case "secs":
            case "sec":
            case "s": {
                result += n;
                break;
            }
        }
    }

    return result;
}

/**
 * Convert seconds into a human-readable string.
 * @param duration The duration in seconds.
 */
export function getHumanReadable(duration: number): string {
    const result: string[] = [];

    const days = Math.trunc(duration / DAY);
    if (days > 0) {
        result.push(days + "d");
        duration -= days * DAY;
    }

    const hours = Math.trunc(duration / HOUR);
    if (hours > 0) {
        result.push(hours + "h");
        duration -= hours * HOUR;
    }

    const minutes = Math.trunc(duration / MINUTE);
    if (minutes > 0) {
        result.push(minutes + "m");
        duration -= minutes * MINUTE;
    }

    const seconds = Math.trunc(duration);
    if (seconds > 0) {
        result.push(seconds + "s");
    }

    return result.join(" ");
}
