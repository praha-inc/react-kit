import { describe, expect, it, vi } from 'vitest';

import { notify, subscribe } from './storage-event-bus';

describe('subscribe', () => {
  it('should call the listener when notify is called for the same storage and key', () => {
    const listener = vi.fn();
    subscribe(localStorage, 'subscribe-basic', listener);

    notify(localStorage, 'subscribe-basic');

    expect(listener).toHaveBeenCalledOnce();
  });

  it('should call multiple listeners registered for the same storage and key', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    subscribe(localStorage, 'subscribe-multiple', listener1);
    subscribe(localStorage, 'subscribe-multiple', listener2);

    notify(localStorage, 'subscribe-multiple');

    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledOnce();
  });

  it('should not call the listener when notify is called for a different key', () => {
    const listener = vi.fn();
    subscribe(localStorage, 'subscribe-key-a', listener);

    notify(localStorage, 'subscribe-key-b');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should not call the listener when notify is called for a different storage', () => {
    const listener = vi.fn();
    subscribe(localStorage, 'subscribe-storage', listener);

    notify(sessionStorage, 'subscribe-storage');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should stop calling the listener after it unsubscribes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(localStorage, 'subscribe-unsubscribe', listener);

    unsubscribe();
    notify(localStorage, 'subscribe-unsubscribe');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should not affect other listeners when one unsubscribes', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const unsubscribe1 = subscribe(localStorage, 'subscribe-unsubscribe-partial', listener1);
    subscribe(localStorage, 'subscribe-unsubscribe-partial', listener2);

    unsubscribe1();
    notify(localStorage, 'subscribe-unsubscribe-partial');

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledOnce();
  });

  it('should be safe to unsubscribe more than once', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(localStorage, 'subscribe-double-unsubscribe', listener);

    unsubscribe();

    expect(() => unsubscribe()).not.toThrow();
  });

  it('should allow subscribing again after unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(localStorage, 'subscribe-resubscribe', listener);
    unsubscribe();
    subscribe(localStorage, 'subscribe-resubscribe', listener);

    notify(localStorage, 'subscribe-resubscribe');

    expect(listener).toHaveBeenCalledOnce();
  });
});

describe('notify', () => {
  it('should not throw when there are no listeners for the storage', () => {
    expect(() => notify(localStorage, 'notify-unregistered')).not.toThrow();
  });

  it('should not throw when there are no listeners for the key', () => {
    subscribe(localStorage, 'notify-key-a', vi.fn());

    expect(() => notify(localStorage, 'notify-key-b')).not.toThrow();
  });
});
