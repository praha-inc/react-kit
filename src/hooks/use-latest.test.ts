import { renderHook } from '@testing-library/react';
import { useCallback } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { useLatest } from './use-latest';

describe('useLatest', () => {
  test('should return the latest value after update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useLatest(value),
      { initialProps: { value: 1 } },
    );

    expect(result.current.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current.current).toBe(2);
  });

  test('should return the latest function reference', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => {
        const callback = useLatest(value);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return useCallback(() => callback.current(), []);
      },
      { initialProps: { value: callback } },
    );

    expect(callback).toHaveBeenCalledTimes(0);
    result.current();
    expect(callback).toHaveBeenCalledTimes(1);

    const newCallback = vi.fn();
    rerender({ value: newCallback });

    expect(newCallback).toHaveBeenCalledTimes(0);
    result.current();
    expect(newCallback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
