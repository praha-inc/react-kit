import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { isFunction } from '../internals/is-function';

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Dispatch, SetStateAction } from 'react';

type InferOutput<Schema extends StandardSchemaV1> = StandardSchemaV1.InferOutput<Schema>;

const noop = () => undefined;

const listeners = new WeakMap<Storage, Map<string, Set<() => void>>>();
const getOrCreateListeners = (storage: Storage, key: string): Set<() => void> => {
  if (!listeners.has(storage)) listeners.set(storage, new Map());
  const keyMap = listeners.get(storage)!;
  if (!keyMap.has(key)) keyMap.set(key, new Set());
  return keyMap.get(key)!;
};

const parse = (snapshot: string | undefined): unknown => {
  if (!snapshot) return undefined;
  try {
    return JSON.parse(snapshot);
  } catch (error) {
    console.warn(`Failed to parse storage value for "${snapshot}":`, error);
    return undefined;
  }
};

const validate = <Schema extends StandardSchemaV1>(
  parsed: unknown,
  schema: Schema,
): InferOutput<Schema> => {
  const result = schema['~standard'].validate(parsed);

  if (result instanceof Promise) {
    throw new TypeError('async schema validation is not supported');
  }

  if (result.issues) {
    throw new TypeError('invalid storage value', { cause: result.issues });
  }

  return result.value;
};

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
  equals?: ((a: InferOutput<Schema>, b: InferOutput<Schema>) => boolean) | undefined;
};

/**
 * The setter returned by {@link useStorageState}.
 * Accepts a new value or an updater function, matching the `setState` signature from `useState`.
 *
 * @template T - The type of the stored value.
 */
export type UseStorageSetState<T> = Dispatch<SetStateAction<T>>;

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
 * @throws {TypeError} When the stored value fails schema validation or cannot be parsed as JSON.
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
): [InferOutput<Schema>, UseStorageSetState<InferOutput<Schema>>] => {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (!options.storage) throw new Error('storage is not available');

    const listenerSet = getOrCreateListeners(options.storage, options.key);
    listenerSet.add(onStoreChange);

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
      listenerSet.delete(onStoreChange);
      if (listenerSet.size <= 0) {
        listeners.get(options.storage)?.delete(options.key);
      }
      globalThis.removeEventListener('storage', handler);
    };
  }, [options.key, options.storage]);

  const getSnapshot = useCallback(() => {
    if (!options.storage) throw new Error('storage is not available');

    return options.storage.getItem(options.key) ?? undefined;
  }, [options.key, options.storage]);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, noop);

  const state = useMemo<InferOutput<Schema>>(() => {
    return validate(parse(snapshot), options.schema);
  }, [snapshot, options.schema]);

  const setState = useCallback<UseStorageSetState<InferOutput<Schema>>>((valueOrFn) => {
    if (!options.storage) throw new Error('storage is not available');

    const currentState = validate(parse(options.storage.getItem(options.key) ?? undefined), options.schema);
    const nextState = isFunction(valueOrFn) ? valueOrFn(currentState) : valueOrFn;
    const equals = options.equals ?? Object.is;
    if (equals(currentState, nextState)) return;

    if (nextState === undefined) {
      options.storage.removeItem(options.key);
    } else {
      options.storage.setItem(options.key, JSON.stringify(nextState));
    }
    getOrCreateListeners(options.storage, options.key).forEach((listener) => listener());
  }, [options.key, options.storage, options.schema, options.equals]);

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
 * @throws {TypeError} When the stored value fails schema validation or cannot be parsed as JSON.
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
): [InferOutput<Schema>, UseStorageSetState<InferOutput<Schema>>] => {
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
 * @throws {TypeError} When the stored value fails schema validation or cannot be parsed as JSON.
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
): [InferOutput<Schema>, UseStorageSetState<InferOutput<Schema>>] => {
  return useStorageState({
    ...options,
    storage: globalThis.sessionStorage,
  });
};
