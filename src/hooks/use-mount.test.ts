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

  test('should call an async effect on mount', async () => {
    const asyncEffect = vi.fn(async () => {});

    await renderHook(() => useMount(asyncEffect));

    expect(asyncEffect).toHaveBeenCalledTimes(1);
  });
});
