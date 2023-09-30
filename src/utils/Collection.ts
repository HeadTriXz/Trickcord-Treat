export type CompareFunction<T> = (firstValue: T, secondValue: T, firstKey: string, secondKey: string) => number;
export type Filter<T> = (value: T, key: string, collection: Collection<T>) => boolean;

/**
* Hold a bunch of items.
*/
export class Collection<T = unknown> extends Map<string, T> {
    /**
     * Returns true if all elements satisfy the condition.
     * @param fn A function to determine whether an element satisfies the condition.
     */
    every(fn: Filter<T>): boolean {
        for (const [key, value] of this) {
            if (!fn(value, key, this)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Return all the elements that satisfy the condition.
     * @param fn A function to determine whether an element satisfies the condition.
     * @returns A collection containing all elements that satisfied the condition.
     */
    filter(fn: Filter<T>): Collection<T> {
        const result = new Collection<T>();
        for (const [key, value] of this) {
            if (fn(value, key, this)) {
                result.set(key, value);
            }
        }

        return result;
    }

    /**
     * Return the first element that satisfies the condition.
     * @param fn A function to determine whether an element satisfies the condition.
     */
    find(fn: Filter<T>): T | undefined {
        for (const [key, value] of this) {
            if (fn(value, key, this)) {
                return value;
            }
        }
    }

    /**
     * Returns a value resulting from applying a function to every element of the collection.
     * @param fn A function that takes the previous value and the next item and returns a new value.
     * @param initialValue The initial value passed to the function.
     */
    reduce<R = T>(fn: (previousValue: R, value: T, key: string) => R, initialValue?: R): R {
        const iterable = this.entries();

        let value;
        let result = initialValue ?? iterable.next().value;

        while ((value = iterable.next().value) !== undefined) {
            result = fn(result, value[1], value[0]);
        }

        return result;
    }

    /**
     * Returns true if at least one element satisfies the condition.
     * @param fn A function to determine whether an element satisfies the condition.
     */
    some(fn: Filter<T>): boolean {
        for (const [key, value] of this) {
            if (fn(value, key, this)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sorts the elements and returns them.
     * @param fn A function to determine the sort order.
     */
    sort(fn: CompareFunction<T>): Collection<T> {
        const entries = [ ...this.entries() ].sort((a, b) => fn(a[1], b[1], a[0], b[0]));
        return new Collection<T>(entries);
    }

    /**
     * Removes all elements that satisfy the condition.
     * @param fn A function to determine whether an element satisfies the condition.
     * @returns The amount of elements removed.
     */
    sweep(fn: Filter<T>): number {
        const size = this.size;
        for (const [key, value] of this) {
            if (fn(value, key, this)) {
                this.delete(key);
            }
        }

        return size - this.size;
    }

    /**
     * Returns an array containing all values.
     */
    toArray(): T[] {
        return [ ...this.values() ];
    }
}
