import { mergeRefs } from './merge-refs';
import { chainFunctions } from '../internals/chain-functions';
import { isFunction } from '../internals/is-function';

import type { Ref } from 'react';

type Props = Record<string, unknown>;

type UnionToIntersection<T> = (
  T extends Props ? (value: T) => void : never
) extends (value: infer R) => void ? R : never;

/**
 * Merges multiple React props objects into a single props object.
 *
 * This utility function combines multiple props objects (such as props passed from a parent
 * component and props defined internally) into a single props object. Properties are merged
 * according to the following rules:
 * - `className` values are concatenated with a space separator.
 * - `ref` values are combined into a single ref callback using {@link mergeRefs}.
 * - Properties whose key starts with `on` (e.g. `onClick`) and whose value is a function are
 *   chained together, so that all of them are called in order.
 * - Any other property is overwritten by the value from the later props object.
 *
 * @template T - A tuple of props objects to be merged.
 *
 * @param props - A variable number of props objects to be merged. Properties from later objects
 * take precedence over earlier ones, except for `className`, `ref`, and event handlers, which are
 * combined as described above.
 *
 * @returns A single props object containing the merged properties of all the provided props objects.
 *
 * @example
 * Merging external props with internal props:
 * ```tsx
 * import { mergeProps } from '@praha/react-kit';
 *
 * import type { ComponentProps, FC } from 'react';
 *
 * const Button: FC<ComponentProps<'button'>> = (props) => {
 *   return (
 *     <button
 *       {...mergeProps(props, {
 *         className: 'button',
 *         onClick: () => console.log('clicked'),
 *       })}
 *     />
 *   );
 * };
 * ```
 */
export const mergeProps = <T extends Props[]>(...props: T): UnionToIntersection<T[number]> => {
  const result: Props = {};

  for (const current of props) {
    for (const key of Object.keys(current)) {
      const previous = result[key];
      const value = current[key];

      if (key === 'className') {
        result[key] = [previous, value].filter(Boolean).join(' ');
      } else if (key === 'ref') {
        result[key] = mergeRefs(previous as Ref<unknown>, value as Ref<unknown>);
      } else if (isFunction(value) && key.startsWith('on')) {
        result[key] = isFunction(previous) ? chainFunctions(previous, value) : value;
      } else {
        result[key] = value;
      }
    }
  }

  return result as UnionToIntersection<T[number]>;
};
