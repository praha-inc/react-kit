import { describe, expect, it, vi } from 'vitest';

import { parseJsonString } from './parse-json-string';

describe('parseJsonString', () => {
  it('should return undefined for undefined', () => {
    expect(parseJsonString(undefined)).toBeUndefined();
  });

  it('should return undefined for an empty string', () => {
    expect(parseJsonString('')).toBeUndefined();
  });

  it('should parse a JSON object string', () => {
    expect(parseJsonString('{"foo":"bar"}')).toEqual({ foo: 'bar' });
  });

  it('should parse a JSON array string', () => {
    expect(parseJsonString('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('should parse a JSON primitive string', () => {
    expect(parseJsonString('42')).toBe(42);
  });

  it('should throw the original error for an invalid JSON string when no fallback is given', () => {
    expect(() => parseJsonString('invalid')).toThrow(SyntaxError);
  });

  it('should call fallback for an invalid JSON string', () => {
    const fallback = vi.fn().mockReturnValue('default');

    expect(parseJsonString('invalid', fallback)).toBe('default');
    expect(fallback).toHaveBeenCalledExactlyOnceWith();
  });
});
