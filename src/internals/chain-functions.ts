/**
 * Combines multiple functions into a single function that calls each of them in order.
 *
 * @param fns - The functions to be called in order.
 * @returns A function that, when called, calls each of the provided functions with the same arguments.
 *
 * @example
 * ```ts
 * const fn = chainFunctions(
 *   (value) => console.log('first', value),
 *   (value) => console.log('second', value),
 * );
 *
 * fn('value'); // logs 'first value' then 'second value'
 * ```
 */
export const chainFunctions = (...fns: ((...args: unknown[]) => unknown)[]) => {
  return (...args: unknown[]) => {
    fns.forEach((fn) => fn(...args));
  };
};
