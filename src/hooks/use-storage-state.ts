import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { isFunction } from '../internals/is-function';
import { parseJsonString } from '../internals/parse-json-string';
import { notify, subscribe } from '../internals/storage-event-bus';
import { validateSchema } from '../internals/validate-schema';

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Dispatch } from 'react';

const noop = () => undefined;

/**
 * Options for {@link useStorageState}.
 *
 * @template Schema - A Standard Schema used to validate and type the stored value.
 */
export type UseStorageStateOptions<Schema extends StandardSchemaV1> = {
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
  fallback?: (() => StandardSchemaV1.InferInput<Schema>) | undefined;
  /**
   * Callback invoked once with the value read from storage the first time it is read.
   */
  onRestored?: ((value: StandardSchemaV1.InferOutput<Schema>) => void) | undefined;
};

/**
 * The setter returned by {@link useStorageState}.
 * Accepts a new value or an updater function, matching the `setState` signature from `useState`.
 *
 * The value written to storage is validated on the next read, not on write, so it is typed as the
 * schema's input rather than its output. An updater function still receives the previously validated
 * output as its argument.
 *
 * @template Input - The type accepted when writing a new value.
 * @template Output - The validated type of the stored value.
 */
export type UseStorageSetState<Input, Output = Input> = Dispatch<Input | ((previous: Output) => Input)>;

/**
 * A React hook that synchronizes state with a Web Storage entry (`localStorage` or `sessionStorage`).
 *
 * The value is serialized as JSON on write and validated against the provided Standard Schema on read.
 * Cross-tab updates are detected via the native `storage` event and trigger a re-render automatically.
 *
 * @template Schema - A Standard Schema used to validate and type the stored value.
 *
 * @param options - Configuration including the storage key, `Storage` instance, schema, and optional equality function.
 * @returns A `[state, setState]` tuple. `state` is the validated, typed value from storage.
 *   `setState` accepts either a new value or an updater function `(prev) => next`.
 *
 * @throws {TypeError} When the stored value fails schema validation, or when a value passed to `setState` fails schema validation on write.
 * @throws When the stored value cannot be parsed as JSON and no `fallback` option is provided;
 *   otherwise the `fallback` function's return value is used in its place.
 *
 * @example
 * ```tsx
 * import { useStorageState } from '@praha/react-kit';
 * import * as v from 'valibot';
 *
 * import type { FC } from 'react';
 *
 * const schema = v.object({ count: v.number() });
 *
 * const Counter: FC = () => {
 *   const [state, setState] = useStorageState({
 *     key: 'counter',
 *     storage: globalThis.localStorage,
 *     schema,
 *   });
 *
 *   return (
 *     <button onClick={() => setState((s) => ({ count: s.count + 1 }))}>
 *       Count: {state.count}
 *     </button>
 *   );
 * };
 * ```
 */
export const useStorageState = <Schema extends StandardSchemaV1>(
  options: UseStorageStateOptions<Schema>,
): [StandardSchemaV1.InferOutput<Schema>, UseStorageSetState<StandardSchemaV1.InferInput<Schema>, StandardSchemaV1.InferOutput<Schema>>] => {
  const subscribeToStore = useCallback((onStoreChange: () => void) => {
    if (!options.storage) throw new Error('storage is not available');

    const unsubscribe = subscribe(options.storage, options.key, onStoreChange);

    const handler = (event: StorageEvent) => {
      if (
        (event.key === null || event.key === options.key)
        && event.storageArea === options.storage
      ) {
        onStoreChange();
      }
    };
    globalThis.addEventListener('storage', handler);

    return () => {
      unsubscribe();
      globalThis.removeEventListener('storage', handler);
    };
  }, [options.key, options.storage]);

  const getSnapshot = useCallback(() => {
    if (!options.storage) throw new Error('storage is not available');

    return options.storage.getItem(options.key) ?? undefined;
  }, [options.key, options.storage]);

  const snapshot = useSyncExternalStore(subscribeToStore, getSnapshot, noop);

  const state = useMemo<StandardSchemaV1.InferOutput<Schema>>(() => {
    return validateSchema(options.schema, parseJsonString(snapshot, options.fallback));
  }, [snapshot, options.schema, options.fallback]);

  const isRestoredRef = useRef(false);
  useEffect(() => {
    if (isRestoredRef.current) return;
    isRestoredRef.current = true;

    if (!options.storage) throw new Error('storage is not available');
    options.onRestored?.(validateSchema(options.schema, parseJsonString(options.storage.getItem(options.key) ?? undefined, options.fallback)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setState = useCallback<UseStorageSetState<StandardSchemaV1.InferInput<Schema>, StandardSchemaV1.InferOutput<Schema>>>((valueOrFn) => {
    if (!options.storage) throw new Error('storage is not available');

    const currentState = validateSchema(options.schema, parseJsonString(options.storage.getItem(options.key) ?? undefined, options.fallback));
    const nextState = isFunction(valueOrFn) ? valueOrFn(currentState) : valueOrFn;

    if (nextState === undefined) {
      if (currentState === undefined) return;
      options.storage.removeItem(options.key);
      notify(options.storage, options.key);
      return;
    }

    const equals = options.equals ?? Object.is;
    if (equals(currentState, validateSchema(options.schema, nextState))) return;

    options.storage.setItem(options.key, JSON.stringify(nextState));
    notify(options.storage, options.key);
  }, [options.key, options.storage, options.schema, options.equals, options.fallback]);

  return [state, setState];
};

/**
 * A React hook that synchronizes state with `localStorage`.
 *
 * A convenience wrapper around {@link useStorageState} that automatically uses `globalThis.localStorage`
 * as the storage backend. Cross-tab updates are detected via the native `storage` event and trigger a
 * re-render automatically. The value is serialized as JSON on write and validated against the provided
 * Standard Schema on read.
 *
 * @template Schema - A Standard Schema used to validate and type the stored value.
 *
 * @param options - Configuration including the storage key, schema, and optional equality function.
 *   The `storage` option is omitted — `localStorage` is used implicitly.
 * @returns A `[state, setState]` tuple. `state` is the validated, typed value from storage.
 *   `setState` accepts either a new value or an updater function `(prev) => next`.
 *
 * @throws {TypeError} When the stored value fails schema validation, or when a value passed to `setState` fails schema validation on write.
 * @throws When the stored value cannot be parsed as JSON and no `fallback` option is provided;
 *   otherwise the `fallback` function's return value is used in its place.
 *
 * @example
 * ```tsx
 * import { useLocalStorageState } from '@praha/react-kit';
 * import * as v from 'valibot';
 *
 * import type { FC } from 'react';
 *
 * const schema = v.object({ count: v.number() });
 *
 * const Counter: FC = () => {
 *   const [state, setState] = useLocalStorageState({ key: 'counter', schema });
 *
 *   return (
 *     <button onClick={() => setState((s) => ({ count: s.count + 1 }))}>
 *       Count: {state.count}
 *     </button>
 *   );
 * };
 * ```
 */
export const useLocalStorageState = <Schema extends StandardSchemaV1>(
  options: Omit<UseStorageStateOptions<Schema>, 'storage'>,
): [StandardSchemaV1.InferOutput<Schema>, UseStorageSetState<StandardSchemaV1.InferInput<Schema>, StandardSchemaV1.InferOutput<Schema>>] => {
  return useStorageState({
    ...options,
    storage: globalThis.localStorage,
  });
};

/**
 * A React hook that synchronizes state with `sessionStorage`.
 *
 * A convenience wrapper around {@link useStorageState} that automatically uses `globalThis.sessionStorage`
 * as the storage backend. Unlike `localStorage`, the data is scoped to the current browser tab and is
 * cleared when the tab is closed. The value is serialized as JSON on write and validated against the
 * provided Standard Schema on read.
 *
 * @template Schema - A Standard Schema used to validate and type the stored value.
 *
 * @param options - Configuration including the storage key, schema, and optional equality function.
 *   The `storage` option is omitted — `sessionStorage` is used implicitly.
 * @returns A `[state, setState]` tuple. `state` is the validated, typed value from storage.
 *   `setState` accepts either a new value or an updater function `(prev) => next`.
 *
 * @throws {TypeError} When the stored value fails schema validation, or when a value passed to `setState` fails schema validation on write.
 * @throws When the stored value cannot be parsed as JSON and no `fallback` option is provided;
 *   otherwise the `fallback` function's return value is used in its place.
 *
 * @example
 * ```tsx
 * import { useSessionStorageState } from '@praha/react-kit';
 * import * as v from 'valibot';
 *
 * import type { FC } from 'react';
 *
 * const schema = v.object({ count: v.number() });
 *
 * const Counter: FC = () => {
 *   const [state, setState] = useSessionStorageState({ key: 'counter', schema });
 *
 *   return (
 *     <button onClick={() => setState((s) => ({ count: s.count + 1 }))}>
 *       Count: {state.count}
 *     </button>
 *   );
 * };
 * ```
 */
export const useSessionStorageState = <Schema extends StandardSchemaV1>(
  options: Omit<UseStorageStateOptions<Schema>, 'storage'>,
): [StandardSchemaV1.InferOutput<Schema>, UseStorageSetState<StandardSchemaV1.InferInput<Schema>, StandardSchemaV1.InferOutput<Schema>>] => {
  return useStorageState({
    ...options,
    storage: globalThis.sessionStorage,
  });
};
