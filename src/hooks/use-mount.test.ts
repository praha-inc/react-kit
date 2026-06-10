import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useMount } from './use-mount';

describe('useMount', () => {
  const effect = vi.fn();
  const cleanup = vi.fn();

  beforeEach(() => {
    effect.mockReturnValue(cleanup);
  });

  test('should call effect on mount', () => {
    renderHook(() => useMount(effect));

    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('should not call effect on rerender', () => {
    const { rerender } = renderHook(() => useMount(effect));
    rerender();

    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('should call cleanup on unmount', () => {
    const { unmount } = renderHook(() => useMount(effect));
    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('should return true when mounted', () => {
    const { result } = renderHook(() => useMount(effect));

    expect(result.current).toBe(true);
  });

  test('should return false before mount', () => {
    let isMounted: boolean | undefined;
    renderHook(() => {
      const result = useMount(effect);
      if (isMounted === undefined) isMounted = result;
    });

    expect(isMounted).toBe(false);
  });
});
