import { renderHook } from '@testing-library/react';
import { describe, beforeEach, expect, it, vi } from 'vitest';

import { useRafCallback } from './use-raf-callback';

describe('useRafCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should not call the callback immediately', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRafCallback(callback, []));

    result.current('value');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should call the callback on the next animation frame', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRafCallback(callback, []));

    result.current('value');
    vi.advanceTimersToNextFrame();

    expect(callback).toHaveBeenCalledWith('value');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should only call the callback once if triggered multiple times', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRafCallback(callback, []));

    result.current('first');
    result.current('second');
    result.current('third');
    vi.advanceTimersToNextFrame();

    expect(callback).toHaveBeenCalledWith('third');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should use the latest callback reference', () => {
    const { result, rerender } = renderHook(
      ({ callback }) => useRafCallback(callback, []),
      { initialProps: { callback: vi.fn() } },
    );

    const newCallback = vi.fn();
    rerender({ callback: newCallback });
    result.current('value');
    vi.advanceTimersToNextFrame();

    expect(newCallback).toHaveBeenCalledWith('value');
    expect(newCallback).toHaveBeenCalledTimes(1);
  });

  it('should recreate the callback when dependencies change', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ deps }) => useRafCallback(callback, deps),
      { initialProps: { deps: [1] } },
    );

    const firstCallback = result.current;
    rerender({ deps: [2] });

    expect(result.current).not.toBe(firstCallback);
  });
});
