import { useEffect } from 'react';

import type { EffectCallback } from 'react';

/**
 * A React hook that executes a callback function only once when the component mounts.
 *
 * This hook is a convenience wrapper around `useEffect` with an empty dependency array.
 * It ensures that the provided effect callback is executed only once during the component's
 * lifecycle - specifically when the component is first mounted to the DOM.
 *
 * @param effect - A callback function that will be executed when the component mounts.
 * This function follows the same signature as React's `useEffect` callback, meaning it can
 * optionally return a cleanup function that will be called when the component unmounts.
 *
 * @returns void - This hook does not return any value.
 *
 * @example
 * Basic usage without cleanup:
 * ```tsx
 * import { useMount } from '@praha/react-use';
 * import type { FC } from 'react';
 *
 * const Component: FC () => {
 *   useMount(() => {
 *     console.log('Component mounted!');
 *   });
 *
 *   return <div>Hello World</div>;
 * };
 * ```
 *
 * @example
 * Usage with cleanup function:
 * ```tsx
 * import { useMount } from '@praha/react-use';
 * import type { FC } from 'react';
 *
 * const Component: FC () => {
 *   useMount(() => {
 *     const subscription = subscribeToService();
 *
 *     // Cleanup function that runs on unmount
 *     return () => {
 *       subscription.unsubscribe();
 *     };
 *   });
 *
 *   return <div>Hello World</div>;
 * };
 * ```
 */
export const useMount = (effect: EffectCallback): void => {
  useEffect(effect, []);
};
