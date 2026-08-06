import { useEffect, useState } from 'react';

/**
 * A React hook that returns whether the component has mounted.
 *
 * This hook tracks the component's mounted state, returning `false` on the
 * initial render and `true` once the component has mounted.
 *
 * @returns A boolean state that is `false` on the initial render and `true` after mounting.
 *
 * @example
 * ```tsx
 * import { useMountState } from '@praha/react-kit';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC = () => {
 *   const isMounted = useMountState();
 *
 *   return <div>{isMounted ? 'Mounted' : 'Not mounted'}</div>;
 * };
 * ```
 */
export const useMountState = (): boolean => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};
