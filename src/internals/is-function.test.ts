import { describe, expect, it } from 'vitest';

import { isFunction } from './is-function';

describe('isFunction', () => {
  it('should return true for a regular function', () => {
    expect(isFunction(function () {})).toBe(true);
  });

  it('should return true for an arrow function', () => {
    expect(isFunction(() => {})).toBe(true);
  });

  it('should return true for an async function', () => {
    expect(isFunction(async () => {})).toBe(true);
  });

  it('should return true for a class constructor', () => {
    expect(isFunction(class {})).toBe(true);
  });

  it('should return false for a string', () => {
    expect(isFunction('string')).toBe(false);
  });

  it('should return false for a number', () => {
    expect(isFunction(42)).toBe(false);
  });

  it('should return false for a boolean', () => {
    expect(isFunction(true)).toBe(false);
  });

  it('should return false for an object', () => {
    expect(isFunction({})).toBe(false);
  });

  it('should return false for an array', () => {
    expect(isFunction([])).toBe(false);
  });

  it('should return false for null', () => {
    expect(isFunction(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isFunction(undefined)).toBe(false);
  });
});
