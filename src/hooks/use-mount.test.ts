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
    const hook = renderHook(() => useMount(effect));
    hook.rerender();

    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('should call cleanup on unmount', () => {
    const hook = renderHook(() => useMount(effect));
    hook.unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
