import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useRafState } from './use-raf-state';

describe('useRafState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('should initialize state with a direct value', () => {
    const { result } = renderHook(() => useRafState(0));

    expect(result.current[0]).toBe(0);
  });

  test('should initialize state with a function', () => {
    const { result } = renderHook(() => useRafState(() => 0));

    expect(result.current[0]).toBe(0);
  });

  test('should update state using a direct value', () => {
    const { result } = renderHook(() => useRafState(0));
    const setState = result.current[1];

    act(() => {
      setState(1);
      vi.advanceTimersToNextFrame();
    });

    expect(result.current[0]).toBe(1);
  });

  test('should update state using a function', () => {
    const { result } = renderHook(() => useRafState(0));
    const setState = result.current[1];

    act(() => {
      setState((previous) => previous + 1);
      vi.advanceTimersToNextFrame();
    });

    expect(result.current[0]).toBe(1);
  });

  test('should batch multiple state updates in a single animation frame', () => {
    const { result } = renderHook(() => useRafState(0));
    const setState = result.current[1];
    const action = vi.fn().mockReturnValue(1);

    act(() => {
      setState(action);
      setState(action);
      vi.advanceTimersToNextFrame();
    });

    expect(result.current[0]).toBe(1);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
