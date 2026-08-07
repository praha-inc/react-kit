import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Validates a value against a Standard Schema and returns the validated output.
 *
 * @param schema - The Standard Schema to validate against.
 * @param value - The value to validate.
 * @returns The validated output value.
 * @throws {TypeError} If the schema performs asynchronous validation.
 * @throws {TypeError} If the value does not satisfy the schema.
 *
 * @example
 * ```ts
 * validateSchema(schema, { foo: 'bar' }); // validated output
 * ```
 */
export const validateSchema = <Schema extends StandardSchemaV1>(
  schema: Schema,
  value: unknown,
): StandardSchemaV1.InferOutput<Schema> => {
  const result = schema['~standard'].validate(value);

  if (result instanceof Promise) {
    throw new TypeError('async schema validation is not supported');
  }

  if (result.issues) {
    throw new TypeError('invalid value', { cause: result.issues });
  }

  return result.value;
};
