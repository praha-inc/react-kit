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

  it('should return undefined and warn for an invalid JSON string', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(parseJsonString('invalid')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Failed to JSON parse for "invalid":', expect.anything());
  });
});
