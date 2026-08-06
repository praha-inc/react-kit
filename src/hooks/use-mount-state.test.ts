import { describe, expect, test } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useMountState } from './use-mount-state';

describe('useMountState', () => {
  test('should return true when mounted', async () => {
    const { result } = await renderHook(() => useMountState());

    expect(result.current).toBe(true);
  });

  test('should return false before mount', async () => {
    let isMounted: boolean | undefined;
    await renderHook(() => {
      const result = useMountState();
      if (isMounted === undefined) isMounted = result;
    });

    expect(isMounted).toBe(false);
  });
});
