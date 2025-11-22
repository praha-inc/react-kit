import { useCallback } from 'react';

import { useLatest } from './use-latest';
import { useRafState } from './use-raf-state';

import type { RefCallback } from 'react';

/** Represents the dimensions of an element. */
export type Size = {
  /** The width of the element in pixels. */
  width: number;
  /** The height of the element in pixels. */
  height: number;
};

/** Configuration options for the useSize hook. */
export type UseSizeOptions = {
  /**
   * An optional function to query and select a specific element to observe.
   * If provided, this function receives the ref element and should return the target element to measure.
   * If not provided, the ref element itself will be measured.
   * If the function returns null, size tracking will be disabled.
   *
   * @param element - The element attached to the ref callback.
   * @returns The element to observe for size changes, or null to disable observation.
   */
  query?: ((element: Element) => Element | null) | undefined;
};

/**
 * A hook that tracks the size (width and height) of a DOM element using ResizeObserver.
 *
 * This hook provides a ref callback and the current size of the observed element.
 * It leverages the ResizeObserver API to efficiently monitor size changes and updates
 * the size state using requestAnimationFrame (via `useRafState`) to optimize performance
 * and avoid excessive re-renders.
 *
 * The hook is particularly useful for responsive components that need to adjust their
 * behavior or appearance based on their container's dimensions.
 *
 * @param options - Configuration options for the hook.
 * @param options.query - An optional function to select a specific element to observe.
 * If provided, it receives the ref element and should return the target element to measure.
 * This is useful when you want to measure a child or ancestor element instead of the ref element itself.
 *
 * @returns A tuple containing:
 * - A ref callback to attach to the element you want to observe.
 * - The current size of the observed element, or undefined if no element is being observed.
 *
 * @example
 * Basic usage - measuring a div:
 * ```tsx
 * import { useSize } from '@praha/react-kit';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC = () => {
 *   const [ref, size] = useSize();
 *
 *   return (
 *     <div ref={ref}>
 *       Size: {size ? `${size.width}x${size.height}` : 'N/A'}
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * Using the query option to measure a parent element:
 * ```tsx
 * import { useSize } from '@praha/react-kit';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC = () => {
 *   const [ref, size] = useSize({
 *     query: (element) => element.parentElement,
 *   });
 *
 *   return (
 *     <div>
 *       <div ref={ref}>
 *         Parent size: {size ? `${size.width}x${size.height}` : 'N/A'}
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * Using the query option to measure a specific child element:
 * ```tsx
 * import { useSize } from '@praha/react-kit';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC = () => {
 *   const [ref, size] = useSize({
 *     query: (element) => element.querySelector('.target-element'),
 *   });
 *
 *   return (
 *     <div ref={ref}>
 *       <div className="target-element">
 *         This element is being measured
 *       </div>
 *       <div>
 *         Size: {size ? `${size.width}x${size.height}` : 'N/A'}
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 */
export const useSize = (options?: UseSizeOptions): [RefCallback<Element>, Size | undefined] => {
  const [size, setSize] = useRafState<Size>();
  const query = useLatest(options?.query);

  const ref = useCallback<RefCallback<Element>>((element: Element) => {
    const target = query.current ? query.current(element) : element;
    if (!target) {
      setSize(undefined);
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const rect = entry.target.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      });
    });

    resizeObserver.observe(target);
    return () => resizeObserver.disconnect();
  }, []);

  return [ref, size];
};
