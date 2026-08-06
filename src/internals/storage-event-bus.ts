type Listener = () => void;

const registry = new WeakMap<Storage, Map<string, Set<Listener>>>();

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

export const notify = (storage: Storage, key: string): void => {
  registry.get(storage)?.get(key)?.forEach((listener) => listener());
};
