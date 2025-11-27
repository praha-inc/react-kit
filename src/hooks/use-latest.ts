import { useRef } from 'react';

import type { RefObject } from 'react';

/**
 * Returns a ref object that always holds the latest value.
 *
 * This hook creates a mutable ref object that is updated on every render
 * with the current value. It's useful for accessing the most recent value
 * in callbacks or effects without causing re-renders or stale closures.
 *
 * Unlike state, updating the ref doesn't trigger a re-render. The ref
 * is persisted across renders and always contains the most up-to-date value.
 *
 * @template T - The type of the value to be stored in the ref
 * @param {T} value - The value to be stored and kept up-to-date in the ref
 * @returns {RefObject<T>} A ref object whose `.current` property contains the latest value
 *
 * @example
 * ```tsx
 * import { useLatest } from '@praha/react-kit';
 * import { useEffect, useState } from 'react';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC = () => {
 *   const [count, setCount] = useState(0);
 *   const latest = useLatest(count);
 *
 *   useEffect(() => {
 *     const interval = setInterval(() => {
 *       console.log(`Current count: ${latest.current}`);
 *     }, 1000);
 *
 *     return () => clearInterval(interval);
 *   }, []);
 *
 *   return (
 *     <button onClick={() => setCount((value) => value + 1)}>
 *       Count: {count}
 *     </button>
 *   );
 * };
 * ```
 */
export const useLatest = <T>(value: T): RefObject<T> => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};
