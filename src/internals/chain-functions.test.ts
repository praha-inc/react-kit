import { describe, expect, it, vi } from 'vitest';

import { chainFunctions } from './chain-functions';

describe('chainFunctions', () => {
  it('should call a single function with the given arguments', () => {
    const fn = vi.fn();
    const chained = chainFunctions(fn);

    chained('value');

    expect(fn).toHaveBeenCalledWith('value');
  });

  it('should call multiple functions in order with the same arguments', () => {
    const calls: string[] = [];
    const fn1 = vi.fn(() => calls.push('first'));
    const fn2 = vi.fn(() => calls.push('second'));
    const chained = chainFunctions(fn1, fn2);

    chained('value');

    expect(fn1).toHaveBeenCalledWith('value');
    expect(fn2).toHaveBeenCalledWith('value');
    expect(calls).toEqual(['first', 'second']);
  });

  it('should pass multiple arguments to every function', () => {
    const fn = vi.fn();
    const chained = chainFunctions(fn);

    chained('a', 'b', 'c');

    expect(fn).toHaveBeenCalledWith('a', 'b', 'c');
  });

  it('should not throw when called with no functions', () => {
    const chained = chainFunctions();

    expect(() => chained('value')).not.toThrow();
  });
});
