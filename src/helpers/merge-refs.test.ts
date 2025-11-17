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

  it('should handle undefined refs gracefully', () => {
    const ref = undefined;
    const mergedRef = mergeRefs<string | null>(ref);

    const value = 'value';
    expect(() => mergedRef(value)).not.toThrow();
  });

  it('should handle null refs gracefully', () => {
    const ref = null;
    const mergedRef = mergeRefs<string | null>(ref);

    const value = 'value';
    expect(() => mergedRef(value)).not.toThrow();
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

  it('should return cleanup function', () => {
    const ref = { current: null };
    const mergedRef = mergeRefs<string | null>(ref);

    const cleanup = mergedRef('value');

    expect(typeof cleanup).toBe('function');
  });

  it('should set ref to null when cleanup is called', () => {
    const ref = { current: null };
    const mergedRef = mergeRefs<string | null>(ref);

    const cleanup = mergedRef('value') as () => void;
    expect(ref.current).not.toBeNull();

    cleanup();
    expect(ref.current).toBeNull();
  });

  it('should call cleanup function returned from callback ref', () => {
    const cleanupFn = vi.fn();
    const callbackRef = vi.fn(() => cleanupFn);
    const mergedRef = mergeRefs<string>(callbackRef);

    const cleanup = mergedRef('value') as () => void;
    expect(cleanupFn).not.toHaveBeenCalled();

    cleanup();
    expect(cleanupFn).toHaveBeenCalled();
  });

  it('should handle cleanup for multiple refs', () => {
    const ref1 = { current: null };
    const ref2CleanupFn = vi.fn();
    const ref2 = vi.fn(() => ref2CleanupFn);
    const mergedRef = mergeRefs<string | null>(ref1, ref2);

    const cleanup = mergedRef('value') as () => void;
    expect(ref1.current).not.toBeNull();
    expect(ref2CleanupFn).not.toHaveBeenCalled();

    cleanup();
    expect(ref1.current).toBeNull();
    expect(ref2CleanupFn).toHaveBeenCalled();
  });
});
