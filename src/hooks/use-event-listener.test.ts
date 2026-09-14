import { createRef } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useEventListener, useNavigationEventListener, useWindowEventListener } from './use-event-listener';

describe('useEventListener', () => {
  const target = new EventTarget();
  const listener = vi.fn();

  describe('when a target and type are passed', () => {
    const render = () => renderHook(() => useEventListener({ target, type: 'ping', listener }));

    test('should call the listener when the event is dispatched on the target', async () => {
      await render();

      const event = new Event('ping');
      target.dispatchEvent(event);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(event);
    });

    test('should not call the listener for other event types', async () => {
      await render();

      target.dispatchEvent(new Event('pong'));

      expect(listener).not.toHaveBeenCalled();
    });

    test('should remove the listener when the component unmounts', async () => {
      const { unmount } = await render();

      await unmount();
      target.dispatchEvent(new Event('ping'));

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('when the target is null or undefined', () => {
    const render = () => renderHook(
      (props) => useEventListener({ target: props!.target, type: 'ping', listener }),
      { initialProps: { target: null as EventTarget | null | undefined } },
    );

    test('should attach nothing', async () => {
      const { rerender } = await render();

      await rerender({ target: undefined });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('when the target is a ref object', () => {
    const ref = createRef<EventTarget>();
    ref.current = target;
    const render = () => renderHook(() => useEventListener({ target: ref, type: 'ping', listener }));

    test('should read the target from the ref', async () => {
      await render();

      target.dispatchEvent(new Event('ping'));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the target changes between renders', () => {
    const other = new EventTarget();
    const render = () => renderHook(
      (props) => useEventListener({ target: props!.target, type: 'ping', listener }),
      { initialProps: { target } },
    );

    test('should re-subscribe to the new target', async () => {
      const { rerender } = await render();

      await rerender({ target: other });
      target.dispatchEvent(new Event('ping'));
      other.dispatchEvent(new Event('ping'));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the type changes between renders', () => {
    const render = () => renderHook(
      (props) => useEventListener({ target, type: props!.type, listener }),
      { initialProps: { type: 'ping' } },
    );

    test('should re-subscribe to the new type', async () => {
      const { rerender } = await render();

      await rerender({ type: 'pong' });
      target.dispatchEvent(new Event('ping'));
      target.dispatchEvent(new Event('pong'));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the listener changes between renders', () => {
    const other = vi.fn();
    const render = () => renderHook(
      (props) => useEventListener({ target, type: 'ping', listener: props!.listener }),
      { initialProps: { listener } },
    );

    test('should call the latest listener without re-subscribing', async () => {
      const addEventListener = vi.spyOn(target, 'addEventListener');
      const { rerender } = await render();

      await rerender({ listener: other });
      target.dispatchEvent(new Event('ping'));

      expect(addEventListener).toHaveBeenCalledTimes(1);
      expect(listener).not.toHaveBeenCalled();
      expect(other).toHaveBeenCalledTimes(1);
    });
  });

  describe('when no listener options are passed', () => {
    const render = () => renderHook(() => useEventListener({ target, type: 'ping', listener }));

    test('should pass an empty options object to addEventListener', async () => {
      const addEventListener = vi.spyOn(target, 'addEventListener');
      await render();

      expect(addEventListener).toHaveBeenCalledWith('ping', expect.any(Function), {});
    });
  });

  describe('when the listener options is passed', () => {
    const controller = new AbortController();
    const render = () => renderHook(() => useEventListener({
      target,
      type: 'ping',
      listener,
      capture: true,
      once: true,
      passive: true,
      signal: controller.signal,
    }));

    test('should pass the options to addEventListener', async () => {
      const addEventListener = vi.spyOn(target, 'addEventListener');
      await render();

      expect(addEventListener).toHaveBeenCalledWith('ping', expect.any(Function), {
        capture: true,
        once: true,
        passive: true,
        signal: controller.signal,
      });
    });

    test('should not re-subscribe when the same options are passed again', async () => {
      const addEventListener = vi.spyOn(target, 'addEventListener');
      const { rerender } = await render();

      await rerender();

      expect(addEventListener).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useWindowEventListener', () => {
  const listener = vi.fn();
  const render = () => renderHook(() => useWindowEventListener({ type: 'resize', listener }));

  test('should call the listener when the event is dispatched on window', async () => {
    await render();

    const event = new Event('resize');
    globalThis.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(event);
  });

  test('should remove the listener when the component unmounts', async () => {
    const { unmount } = await render();

    await unmount();
    globalThis.dispatchEvent(new Event('resize'));

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('useNavigationEventListener', () => {
  const listener = vi.fn();
  const render = () => renderHook(() => useNavigationEventListener({ type: 'currententrychange', listener }));

  test('should call the listener when the current entry changes', async () => {
    await render();

    history.pushState(null, '', '#pushed');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ navigationType: 'push' });
  });

  test('should remove the listener when the component unmounts', async () => {
    const { unmount } = await render();

    await unmount();
    history.replaceState(null, '', '#replaced');

    expect(listener).not.toHaveBeenCalled();
  });
});
