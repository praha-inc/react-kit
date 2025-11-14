import { useCallback, useRef } from 'react';

import { useLatest } from './use-latest';

import type { DependencyList } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/**
 * A React hook that wraps a callback function to be executed on the next animation frame using `requestAnimationFrame`.
 *
 * This hook is useful for optimizing performance when dealing with frequent updates, such as scroll or resize events.
 * If the callback is triggered multiple times before the animation frame is executed, only the last call will be processed,
 * effectively debouncing the callback to the next animation frame.
 *
 * The callback is automatically cancelled if the component unmounts or if a new callback is triggered before the previous
 * animation frame executes.
 *
 * @template T - The type of the callback function to be wrapped
 * @param callback - The function to be executed on the next animation frame
 * @param deps - Dependency array that determines when the returned callback should be recreated
 * @returns A memoized callback function that schedules the original callback to run on the next animation frame
 *
 * @example
 * ```tsx
 * import { useRafCallback } from '@praha/react-kit';
 * import type { FC } from 'react';
 *
 * const Component: FC () => {
 *   const handleMouseMove = useRafCallback((event: MouseEvent) => {
 *     // This will log the mouse position at most once per animation frame
 *     console.log(`Mouse position: ${event.clientX}, ${event.clientY}`);
 *   }, []);
 *
 *   useEffect(() => {
 *     window.addEventListener('mousemove', handleMouseMove);
 *     return () => window.removeEventListener('mousemove', handleMouseMove);
 *   }, [handleMouseMove]);
 *
 *   return <div>Move your mouse around!</div>;
 * };
 * ```
 */
export const useRafCallback = <T extends AnyFunction>(
  callback: T,
  deps: DependencyList,
): (...args: Parameters<T>) => void => {
  const rafRef = useRef<number | null>(null);
  const callbackRef = useLatest(callback);

  return useCallback((...args: Parameters<T>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      callbackRef.current(...args);
      rafRef.current = null;
    });
  }, deps);
};
