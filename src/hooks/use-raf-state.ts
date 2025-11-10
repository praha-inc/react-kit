import { useCallback, useRef, useState } from 'react';

import type { Dispatch, SetStateAction } from 'react';

/**
 * A hook that manages state updates through requestAnimationFrame.
 *
 * This hook is similar to `useState`, but it schedules state updates using
 * `requestAnimationFrame` instead of updating immediately. This is useful for
 * optimizing frequent state updates, especially those tied to animations or
 * visual changes, by batching them to the browser's next repaint cycle.
 *
 * If multiple updates are requested before the next animation frame, only the
 * last update will be applied, effectively debouncing the updates to the
 * animation frame rate.
 *
 * @template T - The type of the state value
 * @param {T | (() => T)} initialState - The initial state value or a function that returns the initial state
 * @returns {[T, Dispatch<SetStateAction<T>>]} A tuple containing the current state and a setter function that schedules updates via requestAnimationFrame
 *
 * @example
 * ```tsx
 * const [position, setPosition] = useRafState({ x: 0, y: 0 });
 *
 * const handleMouseMove = (e: MouseEvent) => {
 *   // Updates will be batched to animation frames
 *   setPosition({ x: e.clientX, y: e.clientY });
 * };
 */
export const useRafState = <T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>] => {
  const ref = useRef<number | undefined>(undefined);
  const [state, setState] = useState(initialState);

  const setRafState = useCallback<Dispatch<SetStateAction<T>>>((value) => {
    if (ref.current) cancelAnimationFrame(ref.current);
    ref.current = requestAnimationFrame(() => {
      setState(value);
    });
  }, []);

  return [state, setRafState];
};
