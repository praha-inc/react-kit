/**
 * Parses a JSON string, returning `undefined` if the value is missing or invalid.
 *
 * @param value - The JSON string to parse.
 * @returns The parsed value, or `undefined` if `value` is `undefined` or not valid JSON.
 *
 * @example
 * ```ts
 * parseJsonString('{"foo":"bar"}'); // { foo: 'bar' }
 * parseJsonString('invalid'); // undefined
 * parseJsonString(undefined); // undefined
 * ```
 */
export const parseJsonString = (value: string | undefined): unknown => {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(`Failed to JSON parse for "${value}":`, error);
    return undefined;
  }
};
