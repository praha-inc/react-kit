/**
 * Parses a JSON string, returning `undefined` if the value is missing.
 *
 * @param value - The JSON string to parse.
 * @param fallback - Called when `value` fails to parse as JSON. Its return value is used as the
 *   parsed result instead of throwing.
 * @returns The parsed value, or `undefined` if `value` is `undefined`.
 * @throws The original `JSON.parse` error when `value` is not valid JSON and no `fallback` is provided.
 *
 * @example
 * ```ts
 * parseJsonString('{"foo":"bar"}'); // { foo: 'bar' }
 * parseJsonString(undefined); // undefined
 * parseJsonString('invalid'); // throws SyntaxError
 * parseJsonString('invalid', () => 'default'); // 'default'
 * ```
 */
export const parseJsonString = (value: string | undefined, fallback?: () => unknown): unknown => {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    if (fallback) return fallback();
    throw error;
  }
};
