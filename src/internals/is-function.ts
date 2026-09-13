/**
 * Type guard that checks whether a given value is a function.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a function, narrowing the type to `(...args: never[]) => unknown`.
 *
 * @example
 * ```ts
 * isFunction(() => {}); // true
 * isFunction('string'); // false
 * ```
 */
export const isFunction = (value: unknown): value is (...args: never[]) => unknown => {
  return typeof value === 'function';
};
