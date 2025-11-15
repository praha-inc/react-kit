import type { Ref, RefCallback } from 'react';

/**
 * Merges multiple React refs into a single ref callback.
 *
 * This utility function combines multiple refs (either callback refs or object refs created with
 * `useRef`) into a single ref callback that can be attached to a React element.
 * When the returned callback is invoked, it will update all the provided refs with the same value.
 * This is particularly useful when you need to attach multiple refs to a single DOM element or
 * component instance - for example, when combining a forwarded ref with an internal ref, or when
 * using refs from multiple hooks or parent components.
 *
 * @template T - The type of the element or instance that the refs will reference.
 * This is typically a DOM element type (e.g., `HTMLDivElement`) or a component instance type.
 *
 * @param refs - A variable number of refs to be merged. Each ref can be:
 * - A callback ref: A function that receives the element/instance as its argument
 * - An object ref: A mutable ref object with a `current` property (created via `useRef` or `createRef`)
 * - `null` or `undefined`: These values are safely ignored
 *
 * @returns A ref callback function that updates all provided refs with the same value when invoked.
 * This returned callback can be passed directly to the `ref` prop of a React element.
 *
 * @example
 * Combining a forwarded ref with an internal ref:
 * ```tsx
 * import { mergeRefs } from '@praha/react-kit';
 * import { useRef } from 'react';
 *
 * import type { ComponentProps, FC } from 'react';
 *
 * const Component: FC<ComponentProps<'div'>> = ({ ref, ...props }) => {
 *   const internalRef = useRef<HTMLDivElement>(null);
 *
 *   return (
 *     <div
 *       {...props}
 *       ref={mergeRefs(ref, internalRef)}
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * Using with custom hooks that return refs:
 * ```tsx
 * import { mergeRefs } from '@praha/react-kit';
 * import { useRef } from 'react';
 *
 * import type { FC } from 'react';
 *
 * const useFocusOnMount = () => {
 *   const ref = useRef<HTMLDivElement>(null);
 *
 *   useEffect(() => {
 *     ref.current?.focus();
 *   }, []);
 *
 *   return ref;
 * };
 *
 * const Component: FC = () => {
 *   const focusRef = useFocusOnMount();
 *   const anotherRef = useRef<HTMLDivElement>(null);
 *
 *   return <div ref={mergeRefs(focusRef, anotherRef)} />;
 * };
 * ```
 */
export const mergeRefs = <T>(...refs: Ref<T>[]): RefCallback<T> => {
  return (value) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(value);
        continue;
      }
      ref.current = value;
    }
  };
};
