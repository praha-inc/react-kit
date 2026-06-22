import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useSize } from './use-size';

const createElement = (width: number, height: number): Element => {
  return {
    getBoundingClientRect: () => ({ width, height }),
  } as unknown as Element;
};

let resizeObserverCallback: ResizeObserverCallback;
vi.stubGlobal('ResizeObserver', class {
  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObserverCallback = this.callback;
  }

  observe(element: Element) {
    this.callback([{ target: element } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }

  disconnect() {}
});

describe('useSize', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('should return size of the element from ref', async () => {
    const { result, act } = await renderHook(() => useSize());

    await act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 100 });
  });

  test('should return undefined size when ref is not set', async () => {
    const { result } = await renderHook(() => useSize());

    expect(result.current[1]).toBeUndefined();
  });

  test('should update size when ref changes', async () => {
    const { result, act } = await renderHook(() => useSize());

    await act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 100 });

    await act(() => {
      result.current[0](createElement(200, 200));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 200, height: 200 });
  });

  test('should update size when ResizeObserver triggers', async () => {
    const { result, act } = await renderHook(() => useSize());

    await act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 100 });

    await act(() => {
      resizeObserverCallback([{ target: createElement(200, 200) } as ResizeObserverEntry], {} as ResizeObserver);
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 200, height: 200 });
  });

  test('should return size of the element from callback', async () => {
    const { result, act } = await renderHook(() => useSize({
      query: () => createElement(200, 200),
    }));

    await act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 200, height: 200 });
  });

  test('should return undefined size when callback returns null', async () => {
    const { result, act } = await renderHook(() => useSize({
      query: () => null,
    }));

    await act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toBeUndefined();
  });

  test('should transform size using transform option', async () => {
    const { result, act } = await renderHook(() => useSize({
      transform: (size) => ({
        width: Math.round(size.width),
        height: Math.round(size.height),
      }),
    }));

    await act(() => {
      result.current[0](createElement(100.1, 200.1));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 200 });
  });

  test('should apply transform when ResizeObserver triggers', async () => {
    const { result, act } = await renderHook(() => useSize({
      transform: (size) => ({
        width: Math.round(size.width),
        height: Math.round(size.height),
      }),
    }));

    await act(() => {
      result.current[0](createElement(100.1, 200.1));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 200 });

    await act(() => {
      resizeObserverCallback([{ target: createElement(150.1, 250.1) } as ResizeObserverEntry], {} as ResizeObserver);
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 150, height: 250 });
  });
});
