import { describe, beforeEach, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useRafCallback } from './use-raf-callback';

describe('useRafCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should not call the callback immediately', async () => {
    const callback = vi.fn();
    const { result } = await renderHook(() => useRafCallback(callback, []));

    result.current('value');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should call the callback on the next animation frame', async () => {
    const callback = vi.fn();
    const { result } = await renderHook(() => useRafCallback(callback, []));

    result.current('value');
    vi.advanceTimersToNextFrame();

    expect(callback).toHaveBeenCalledWith('value');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should only call the callback once if triggered multiple times', async () => {
    const callback = vi.fn();
    const { result } = await renderHook(() => useRafCallback(callback, []));

    result.current('first');
    result.current('second');
    result.current('third');
    vi.advanceTimersToNextFrame();

    expect(callback).toHaveBeenCalledWith('third');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should use the latest callback reference', async () => {
    const { result, rerender } = await renderHook(
      (props) => useRafCallback(props!.callback, []),
      { initialProps: { callback: vi.fn() } },
    );

    const newCallback = vi.fn();
    await rerender({ callback: newCallback });
    result.current('value');
    vi.advanceTimersToNextFrame();

    expect(newCallback).toHaveBeenCalledWith('value');
    expect(newCallback).toHaveBeenCalledTimes(1);
  });

  it('should recreate the callback when dependencies change', async () => {
    const callback = vi.fn();
    const { result, rerender } = await renderHook(
      (props) => useRafCallback(callback, props!.deps),
      { initialProps: { deps: [1] } },
    );

    const firstCallback = result.current;
    await rerender({ deps: [2] });

    expect(result.current).not.toBe(firstCallback);
  });
});
