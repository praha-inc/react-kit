import { useCallback } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useLatest } from './use-latest';

describe('useLatest', () => {
  test('should return the latest value after update', async () => {
    const { result, rerender } = await renderHook(
      (props) => useLatest(props!.value),
      { initialProps: { value: 1 } },
    );

    expect(result.current.current).toBe(1);

    await rerender({ value: 2 });
    expect(result.current.current).toBe(2);
  });

  test('should return the latest function reference', async () => {
    const callback = vi.fn();
    const { result, rerender } = await renderHook(
      (props) => {
        const callback = useLatest(props!.value);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return react-hooks/exhaustive-deps
        return useCallback(() => callback.current?.(), []);
      },
      { initialProps: { value: callback } },
    );

    expect(callback).toHaveBeenCalledTimes(0);
    result.current();
    expect(callback).toHaveBeenCalledTimes(1);

    const newCallback = vi.fn();
    await rerender({ value: newCallback });

    expect(newCallback).toHaveBeenCalledTimes(0);
    result.current();
    expect(newCallback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
