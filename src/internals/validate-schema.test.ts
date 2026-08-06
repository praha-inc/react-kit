import { describe, expect, it } from 'vitest';

import { validateSchema } from './validate-schema';

import type { StandardSchemaV1 } from '@standard-schema/spec';

const anySchema: StandardSchemaV1 = {
  '~standard': {
    version: 1 as const,
    vendor: 'test',
    validate: (value) => ({ value }),
  },
};

const stringSchema: StandardSchemaV1<string> = {
  '~standard': {
    version: 1 as const,
    vendor: 'test',
    validate: (value) =>
      typeof value === 'string'
        ? { value: value }
        : { issues: [{ message: 'not a string' }] as const },
  },
};

const asyncSchema: StandardSchemaV1 = {
  '~standard': {
    version: 1 as const,
    vendor: 'test',
    validate: (value) => Promise.resolve({ value }),
  },
};

describe('validateSchema', () => {
  it('should return the validated value when validation succeeds', () => {
    expect(validateSchema(anySchema, { foo: 'bar' })).toEqual({ foo: 'bar' });
  });

  it('should return the value as-is for a schema that always passes', () => {
    expect(validateSchema(stringSchema, 'hello')).toBe('hello');
  });

  it('should throw a TypeError when the value fails schema validation', () => {
    expect(() => validateSchema(stringSchema, 42)).toThrow(TypeError);
    expect(() => validateSchema(stringSchema, 42)).toThrow('invalid value');
  });

  it('should include the issues as the cause when validation fails', () => {
    try {
      validateSchema(stringSchema, 42);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      expect((error as TypeError).cause).toEqual([{ message: 'not a string' }]);
    }
  });

  it('should throw a TypeError when the schema validates asynchronously', () => {
    expect(() => validateSchema(asyncSchema, 'value')).toThrow(TypeError);
    expect(() => validateSchema(asyncSchema, 'value')).toThrow('async schema validation is not supported');
  });
});
