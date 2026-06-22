import { describe, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useMount } from './use-mount';

describe('useMount', () => {
  const cleanup = vi.fn();
  const effect = vi.fn(() => cleanup);

  test('should call effect on mount', async () => {
    await renderHook(() => useMount(effect));

    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('should not call effect on rerender', async () => {
    const { rerender } = await renderHook(() => useMount(effect));
    await rerender();

    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('should call cleanup on unmount', async () => {
    const { rerender } = await renderHook(() => useMount(effect));
    await rerender();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('should return true when mounted', async () => {
    const { result } = await renderHook(() => useMount(effect));

    expect(result.current).toBe(true);
  });

  test('should return false before mount', async () => {
    let isMounted: boolean | undefined;
    await renderHook(() => {
      const result = useMount(effect);
      if (isMounted === undefined) isMounted = result;
    });

    expect(isMounted).toBe(false);
  });
});
