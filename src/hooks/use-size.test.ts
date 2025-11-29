import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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

  test('should return size of the element from ref', () => {
    const { result } = renderHook(() => useSize());

    act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 100 });
  });

  test('should return undefined size when ref is not set', () => {
    const { result } = renderHook(() => useSize());

    expect(result.current[1]).toBeUndefined();
  });

  test('should update size when ref changes', () => {
    const { result } = renderHook(() => useSize());

    act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 100 });

    act(() => {
      result.current[0](createElement(200, 200));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 200, height: 200 });
  });

  test('should update size when ResizeObserver triggers', () => {
    const { result } = renderHook(() => useSize());

    act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 100 });

    act(() => {
      resizeObserverCallback([{ target: createElement(200, 200) } as ResizeObserverEntry], {} as ResizeObserver);
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 200, height: 200 });
  });

  test('should return size of the element from callback', () => {
    const { result } = renderHook(() => useSize({
      query: () => createElement(200, 200),
    }));

    act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 200, height: 200 });
  });

  test('should return undefined size when callback returns null', () => {
    const { result } = renderHook(() => useSize({
      query: () => null,
    }));

    act(() => {
      result.current[0](createElement(100, 100));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toBeUndefined();
  });

  test('should transform size using transform option', () => {
    const { result } = renderHook(() => useSize({
      transform: (size) => ({
        width: Math.round(size.width),
        height: Math.round(size.height),
      }),
    }));

    act(() => {
      result.current[0](createElement(100.1, 200.1));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 200 });
  });

  test('should apply transform when ResizeObserver triggers', () => {
    const { result } = renderHook(() => useSize({
      transform: (size) => ({
        width: Math.round(size.width),
        height: Math.round(size.height),
      }),
    }));

    act(() => {
      result.current[0](createElement(100.1, 200.1));
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 100, height: 200 });

    act(() => {
      resizeObserverCallback([{ target: createElement(150.1, 250.1) } as ResizeObserverEntry], {} as ResizeObserver);
      vi.advanceTimersToNextFrame();
    });
    expect(result.current[1]).toEqual({ width: 150, height: 250 });
  });
});
