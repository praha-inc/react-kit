type Listener = () => void;

const registry = new WeakMap<Storage, Map<string, Set<Listener>>>();

/**
 * Registers a listener to be called whenever {@link notify} is called for the same
 * `storage` and `key`. Used to propagate same-tab storage writes, which — unlike
 * cross-tab writes — do not fire the native `storage` event.
 *
 * @param storage - The `Storage` instance to watch (e.g. `localStorage` or `sessionStorage`).
 * @param key - The storage key to watch.
 * @param listener - The callback invoked on notification.
 * @returns A function that unsubscribes the listener.
 *
 * @example
 * ```ts
 * const unsubscribe = subscribe(localStorage, 'draft', () => console.log('changed'));
 * unsubscribe();
 * ```
 */
export const subscribe = (storage: Storage, key: string, listener: Listener): (() => void) => {
  const keyMap = registry.get(storage) ?? new Map<string, Set<Listener>>();
  registry.set(storage, keyMap);

  const listenerSet = keyMap.get(key) ?? new Set<Listener>();
  keyMap.set(key, listenerSet);

  listenerSet.add(listener);

  return () => {
    listenerSet.delete(listener);
    if (listenerSet.size <= 0) keyMap.delete(key);
  };
};

/**
 * Notifies all listeners registered via {@link subscribe} for the given `storage` and `key`.
 *
 * @param storage - The `Storage` instance that was written to.
 * @param key - The storage key that was written to.
 *
 * @example
 * ```ts
 * notify(localStorage, 'draft');
 * ```
 */
export const notify = (storage: Storage, key: string): void => {
  registry.get(storage)?.get(key)?.forEach((listener) => listener());
};
