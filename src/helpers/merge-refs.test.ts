import { describe, expect, it, vi } from 'vitest';

import { mergeRefs } from './merge-refs';

describe('mergeRefs', () => {
  it('should properly assign value to object ref', () => {
    const ref = { current: null };
    const mergedRef = mergeRefs<string | null>(ref);

    const value = 'value';
    mergedRef(value);

    expect(ref.current).toBe(value);
  });

  it('should properly call function ref', () => {
    const callbackRef = vi.fn();
    const mergedRef = mergeRefs<string>(callbackRef);

    const value = 'value';
    mergedRef(value);

    expect(callbackRef).toHaveBeenCalledWith(value);
  });

  it('should merge multiple refs', () => {
    const ref1 = { current: null };
    const ref2 = vi.fn();
    const mergedRef = mergeRefs<string | null>(ref1, ref2);

    const value = 'value';
    mergedRef(value);

    expect(ref1.current).toBe(value);
    expect(ref2).toHaveBeenCalledWith(value);
  });
});
