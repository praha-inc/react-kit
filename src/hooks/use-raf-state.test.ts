import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useRafState } from './use-raf-state';

describe('useRafState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('should initialize state with a direct value', async () => {
    const { result } = await renderHook(() => useRafState(0));

    expect(result.current[0]).toBe(0);
  });

  test('should initialize state with a function', async () => {
    const { result } = await renderHook(() => useRafState(() => 0));

    expect(result.current[0]).toBe(0);
  });

  test('should initialize state as undefined when no initial value is provided', async () => {
    const { result } = await renderHook(() => useRafState());

    expect(result.current[0]).toBeUndefined();
  });

  test('should update state using a direct value', async () => {
    const { result, act } = await renderHook(() => useRafState(0));
    const setState = result.current[1];

    await act(() => {
      setState(1);
      vi.advanceTimersToNextFrame();
    });

    expect(result.current[0]).toBe(1);
  });

  test('should update state using a function', async () => {
    const { result, act } = await renderHook(() => useRafState(0));
    const setState = result.current[1];

    await act(() => {
      setState((previous) => previous + 1);
      vi.advanceTimersToNextFrame();
    });

    expect(result.current[0]).toBe(1);
  });

  test('should batch multiple state updates in a single animation frame', async () => {
    const { result, act } = await renderHook(() => useRafState(0));
    const setState = result.current[1];
    const action = vi.fn().mockReturnValue(1);

    await act(() => {
      setState(action);
      setState(action);
      vi.advanceTimersToNextFrame();
    });

    expect(result.current[0]).toBe(1);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
