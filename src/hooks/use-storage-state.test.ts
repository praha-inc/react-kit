import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useLocalStorageState, useSessionStorageState, useStorageState } from './use-storage-state';

import type { StandardSchemaV1 } from '@standard-schema/spec';

const anySchema: StandardSchemaV1 = {
  '~standard': {
    version: 1 as const,
    vendor: 'test',
    validate: (value) => ({ value }),
  },
};

const stringSchema: StandardSchemaV1<string> = {
  '~standard': {
    version: 1 as const,
    vendor: 'test',
    validate: (value) =>
      typeof value === 'string'
        ? { value: value }
        : { issues: [{ message: 'not a string' }] as const },
  },
};

describe('useStorageState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should return undefined when storage is empty', async () => {
    const { result } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: anySchema }),
    );

    expect(result.current[0]).toBeUndefined();
  });

  test('should return parsed value when storage has a valid JSON entry', async () => {
    localStorage.setItem('test', JSON.stringify({ count: 1 }));

    const { result } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: anySchema }),
    );

    expect(result.current[0]).toEqual({ count: 1 });
  });

  test('should throw when stored value fails schema validation', async () => {
    localStorage.setItem('test', JSON.stringify(42));

    await expect(() =>
      renderHook(() =>
        useStorageState({ key: 'test', storage: localStorage, schema: stringSchema }),
      ),
    ).rejects.toThrow(TypeError);
  });

  test('should write to storage and update state when setState is called with a direct value', async () => {
    const { result, act } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: anySchema }),
    );

    await act(() => {
      result.current[1]('hello');
    });

    expect(result.current[0]).toBe('hello');
    expect(localStorage.getItem('test')).toBe(JSON.stringify('hello'));
  });

  test('should apply updater function to the current value when setState is called with an updater', async () => {
    localStorage.setItem('test', JSON.stringify('1'));

    const { result, act } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: stringSchema }),
    );

    await act(() => {
      result.current[1]((previous) => `${Number(previous) + 1}`);
    });

    expect(result.current[0]).toBe('2');
    expect(localStorage.getItem('test')).toBe(JSON.stringify('2'));
  });

  test('should remove the item from storage when setState is called with undefined', async () => {
    localStorage.setItem('test', JSON.stringify('value'));

    const { result, act } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: anySchema }),
    );

    await act(() => {
      result.current[1](undefined);
    });

    expect(result.current[0]).toBeUndefined();
    expect(localStorage.getItem('test')).toBeNull();
  });

  test('should not write when the updater returns the same reference', async () => {
    localStorage.setItem('test', JSON.stringify('value'));

    const { result, act } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: stringSchema }),
    );

    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    const removeItemSpy = vi.spyOn(localStorage, 'removeItem');

    await act(() => {
      result.current[1]((previous) => previous);
    });

    expect(setItemSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).not.toHaveBeenCalled();
  });

  test('should use the custom equals function to skip writes', async () => {
    localStorage.setItem('test', JSON.stringify({ count: 1 }));

    const equals = vi.fn().mockReturnValue(true);

    const { result, act } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: anySchema, equals }),
    );

    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    await act(() => {
      result.current[1]({ count: 2 });
    });

    expect(equals).toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  test('should update state when a storage event fires for the same key', async () => {
    const { result, act } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: anySchema }),
    );

    expect(result.current[0]).toBeUndefined();

    await act(() => {
      localStorage.setItem('test', JSON.stringify('updated'));
      globalThis.dispatchEvent(
        new StorageEvent('storage', { key: 'test', storageArea: localStorage }),
      );
    });

    expect(result.current[0]).toBe('updated');
  });

  test('should update state when a storage event fires with null key', async () => {
    localStorage.setItem('test', JSON.stringify('value'));

    const { result, act } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: anySchema }),
    );

    expect(result.current[0]).toBe('value');

    await act(() => {
      localStorage.clear();
      globalThis.dispatchEvent(
        new StorageEvent('storage', { key: null, storageArea: localStorage }),
      );
    });

    expect(result.current[0]).toBeUndefined();
  });

  test('should ignore storage events for a different key', async () => {
    const { result, act } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: anySchema }),
    );

    await act(() => {
      localStorage.setItem('other', JSON.stringify('updated'));
      globalThis.dispatchEvent(
        new StorageEvent('storage', { key: 'other', storageArea: localStorage }),
      );
    });

    expect(result.current[0]).toBeUndefined();
  });

  test('should ignore storage events for a different storageArea', async () => {
    const { result, act } = await renderHook(() =>
      useStorageState({ key: 'test', storage: localStorage, schema: anySchema }),
    );

    await act(() => {
      globalThis.dispatchEvent(
        new StorageEvent('storage', { key: 'test', storageArea: sessionStorage }),
      );
    });

    expect(result.current[0]).toBeUndefined();
  });

  test('should notify other hooks watching the same key when setState is called', async () => {
    const { result: hookA, act } = await renderHook(() =>
      useStorageState({ key: 'shared', storage: localStorage, schema: anySchema }),
    );
    const { result: hookB } = await renderHook(() =>
      useStorageState({ key: 'shared', storage: localStorage, schema: anySchema }),
    );

    await act(() => {
      hookA.current[1]('from-a');
    });

    expect(hookB.current[0]).toBe('from-a');
  });
});

describe('useLocalStorageState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should read from localStorage', async () => {
    localStorage.setItem('test', JSON.stringify('initial'));

    const { result } = await renderHook(() =>
      useLocalStorageState({ key: 'test', schema: anySchema }),
    );

    expect(result.current[0]).toBe('initial');
  });

  test('should write to localStorage', async () => {
    const { result, act } = await renderHook(() =>
      useLocalStorageState({ key: 'test', schema: anySchema }),
    );

    await act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test')).toBe(JSON.stringify('updated'));
  });
});

describe('useSessionStorageState', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('should read from sessionStorage', async () => {
    sessionStorage.setItem('test', JSON.stringify('initial'));

    const { result } = await renderHook(() =>
      useSessionStorageState({ key: 'test', schema: anySchema }),
    );

    expect(result.current[0]).toBe('initial');
  });

  test('should write to sessionStorage', async () => {
    const { result, act } = await renderHook(() =>
      useSessionStorageState({ key: 'test', schema: anySchema }),
    );

    await act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(sessionStorage.getItem('test')).toBe(JSON.stringify('updated'));
  });
});
