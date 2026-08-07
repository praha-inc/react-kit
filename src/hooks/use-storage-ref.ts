import { useCallback, useEffect, useRef } from 'react';

import { isFunction } from '../internals/is-function';
import { parseJsonString } from '../internals/parse-json-string';
import { notify } from '../internals/storage-event-bus';
import { validateSchema } from '../internals/validate-schema';

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Options for {@link useStorageRef}.
 *
 * @template Schema - A Standard Schema used to validate and type the stored value.
 */
export type UseStorageRefOptions<Schema extends StandardSchemaV1> = {
  /** The storage key under which the value is persisted. */
  key: string;
  /** The `Storage` instance to use (e.g. `localStorage` or `sessionStorage`). */
  storage: Storage;
  /** The schema used to parse and validate the raw storage value. */
  schema: Schema;
  /**
   * Custom equality function used to skip writes when the next value equals the current value.
   * Defaults to `Object.is`.
   */
  equals?: ((a: StandardSchemaV1.InferOutput<Schema>, b: StandardSchemaV1.InferOutput<Schema>) => boolean) | undefined;
  /**
   * Called when the stored value fails to parse as JSON.
   * Its return value is used in place of the raw stored value. When omitted, the original error is thrown.
   */
  fallback?: (() => unknown) | undefined;
  /**
   * Callback invoked once with the value read from storage the first time it is read.
   */
  onRestored?: ((value: StandardSchemaV1.InferOutput<Schema>) => void) | undefined;
};

/**
 * A stable, imperative reader returned by {@link useStorageRef}.
 * Reads and validates the current value directly from storage on every call, so it never goes stale.
 *
 * @template T - The type of the stored value.
 */
export type UseStorageGetRef<T> = () => T;

/**
 * The setter returned by {@link useStorageRef}.
 * Accepts a new value or an updater function, matching the `setState` signature from `useState`.
 *
 * @template T - The type of the stored value.
 */
export type UseStorageSetRef<T> = Dispatch<SetStateAction<T>>;

/**
 * A React hook that reads from and writes to a Web Storage entry (`localStorage` or `sessionStorage`)
 * without ever triggering a re-render of the calling component.
 *
 * Unlike {@link useStorageState}, this hook does not subscribe to storage changes with
 * `useSyncExternalStore` — it exposes a stable `getValue` function that always reads the latest
 * value directly from storage, and a `setValue` function that writes through. This is intended for
 * cases where some other state owner (e.g. a form library like `react-hook-form` or `conform`) already
 * manages re-rendering, and you only want to persist/restore its value to storage on the side.
 *
 * The value is serialized as JSON on write and validated against the provided Standard Schema on read.
 * Writes still notify any reactive {@link useStorageState} watching the same key elsewhere in the app,
 * but this hook itself never re-renders in response to storage changes.
 *
 * @template Schema - A Standard Schema used to validate and type the stored value.
 *
 * @param options - Configuration including the storage key, `Storage` instance, schema, and optional equality function.
 * @returns A `[getValue, setValue]` tuple. `getValue` reads and validates the current value from storage.
 *   `setValue` accepts either a new value or an updater function `(prev) => next`.
 *
 * @throws {TypeError} When the stored value fails schema validation.
 * @throws When the stored value cannot be parsed as JSON and no `fallback` option is provided;
 *   otherwise the `fallback` function's return value is used in its place.
 *
 * @example
 * ```tsx
 * import { useStorageRef } from '@praha/react-kit';
 * import { useRef } from 'react';
 * import * as v from 'valibot';
 *
 * import type { FC } from 'react';
 *
 * const schema = v.object({ name: v.string() });
 *
 * const Form: FC = () => {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *
 *   const [, setValue] = useStorageRef({
 *     key: 'draft',
 *     storage: globalThis.localStorage,
 *     schema,
 *     onRestored: (value) => {
 *       if (inputRef.current) inputRef.current.value = value.name;
 *     },
 *   });
 *
 *   return (
 *     <input
 *       ref={inputRef}
 *       onChange={(event) => setValue({ name: event.target.value })}
 *     />
 *   );
 * };
 * ```
 */
export const useStorageRef = <Schema extends StandardSchemaV1>(
  options: UseStorageRefOptions<Schema>,
): [UseStorageGetRef<StandardSchemaV1.InferOutput<Schema>>, UseStorageSetRef<StandardSchemaV1.InferOutput<Schema>>] => {
  const getValue = useCallback((): StandardSchemaV1.InferOutput<Schema> => {
    if (!options.storage) throw new Error('storage is not available');

    return validateSchema(options.schema, parseJsonString(options.storage.getItem(options.key) ?? undefined, options.fallback));
  }, [options.key, options.storage, options.schema, options.fallback]);

  const setValue = useCallback<UseStorageSetRef<StandardSchemaV1.InferOutput<Schema>>>((valueOrFn) => {
    if (!options.storage) throw new Error('storage is not available');

    const currentState = getValue();
    const nextState = isFunction(valueOrFn) ? valueOrFn(currentState) : valueOrFn;
    const equals = options.equals ?? Object.is;
    if (equals(currentState, nextState)) return;

    if (nextState === undefined) {
      options.storage.removeItem(options.key);
    } else {
      options.storage.setItem(options.key, JSON.stringify(nextState));
    }
    notify(options.storage, options.key);
  }, [getValue, options.key, options.storage, options.equals]);

  const isRestoredRef = useRef(false);
  useEffect(() => {
    if (isRestoredRef.current) return;
    isRestoredRef.current = true;

    options.onRestored?.(getValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [getValue, setValue];
};

/**
 * A React hook that reads from and writes to `localStorage` without ever triggering a re-render
 * of the calling component.
 *
 * A convenience wrapper around {@link useStorageRef} that automatically uses `globalThis.localStorage`
 * as the storage backend.
 *
 * @template Schema - A Standard Schema used to validate and type the stored value.
 *
 * @param options - Configuration including the storage key, schema, and optional equality function.
 *   The `storage` option is omitted — `localStorage` is used implicitly.
 * @returns A `[getValue, setValue]` tuple. `getValue` reads and validates the current value from storage.
 *   `setValue` accepts either a new value or an updater function `(prev) => next`.
 *
 * @throws {TypeError} When the stored value fails schema validation.
 * @throws When the stored value cannot be parsed as JSON and no `fallback` option is provided;
 *   otherwise the `fallback` function's return value is used in its place.
 *
 * @example
 * ```tsx
 * import { useLocalStorageRef } from '@praha/react-kit';
 * import * as v from 'valibot';
 *
 * import type { FC } from 'react';
 *
 * const schema = v.object({ name: v.string() });
 *
 * const Form: FC = () => {
 *   const [, setValue] = useLocalStorageRef({ key: 'draft', schema });
 *
 *   return (
 *     <input onChange={(event) => setValue({ name: event.target.value })} />
 *   );
 * };
 * ```
 */
export const useLocalStorageRef = <Schema extends StandardSchemaV1>(
  options: Omit<UseStorageRefOptions<Schema>, 'storage'>,
): [UseStorageGetRef<StandardSchemaV1.InferOutput<Schema>>, UseStorageSetRef<StandardSchemaV1.InferOutput<Schema>>] => {
  return useStorageRef({
    ...options,
    storage: globalThis.localStorage,
  });
};

/**
 * A React hook that reads from and writes to `sessionStorage` without ever triggering a re-render
 * of the calling component.
 *
 * A convenience wrapper around {@link useStorageRef} that automatically uses `globalThis.sessionStorage`
 * as the storage backend. Unlike `localStorage`, the data is scoped to the current browser tab and is
 * cleared when the tab is closed.
 *
 * @template Schema - A Standard Schema used to validate and type the stored value.
 *
 * @param options - Configuration including the storage key, schema, and optional equality function.
 *   The `storage` option is omitted — `sessionStorage` is used implicitly.
 * @returns A `[getValue, setValue]` tuple. `getValue` reads and validates the current value from storage.
 *   `setValue` accepts either a new value or an updater function `(prev) => next`.
 *
 * @throws {TypeError} When the stored value fails schema validation.
 * @throws When the stored value cannot be parsed as JSON and no `fallback` option is provided;
 *   otherwise the `fallback` function's return value is used in its place.
 *
 * @example
 * ```tsx
 * import { useSessionStorageRef } from '@praha/react-kit';
 * import * as v from 'valibot';
 *
 * import type { FC } from 'react';
 *
 * const schema = v.object({ name: v.string() });
 *
 * const Form: FC = () => {
 *   const [, setValue] = useSessionStorageRef({ key: 'draft', schema });
 *
 *   return (
 *     <input onChange={(event) => setValue({ name: event.target.value })} />
 *   );
 * };
 * ```
 */
export const useSessionStorageRef = <Schema extends StandardSchemaV1>(
  options: Omit<UseStorageRefOptions<Schema>, 'storage'>,
): [UseStorageGetRef<StandardSchemaV1.InferOutput<Schema>>, UseStorageSetRef<StandardSchemaV1.InferOutput<Schema>>] => {
  return useStorageRef({
    ...options,
    storage: globalThis.sessionStorage,
  });
};
