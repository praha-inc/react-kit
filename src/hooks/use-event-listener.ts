import { useEffect, useEffectEvent } from 'react';

import type { RefObject } from 'react';

/**
 * Maps a known event target type to its event map, so that event names and
 * event objects can be inferred from the target. Unknown targets fall back to
 * accepting any event name with a plain {@link Event}.
 */
export type EventMapOf<Target extends EventTarget> = Target extends Window ? WindowEventMap
  : Target extends Document ? DocumentEventMap
    : Target extends ShadowRoot ? ShadowRootEventMap
      : Target extends HTMLBodyElement ? HTMLBodyElementEventMap
        : Target extends HTMLVideoElement ? HTMLVideoElementEventMap
          : Target extends HTMLMediaElement ? HTMLMediaElementEventMap
            : Target extends HTMLElement ? HTMLElementEventMap
              : Target extends SVGElement ? SVGElementEventMap
                : Target extends MathMLElement ? MathMLElementEventMap
                  : Target extends Element ? ElementEventMap
                    : Target extends Navigation ? NavigationEventMap
                      : Target extends MediaQueryList ? MediaQueryListEventMap
                        : Target extends AbortSignal ? AbortSignalEventMap
                          : Target extends Animation ? AnimationEventMap
                            : Target extends VisualViewport ? VisualViewportEventMap
                              : Target extends ScreenOrientation ? ScreenOrientationEventMap
                                : Target extends BroadcastChannel ? BroadcastChannelEventMap
                                  : Target extends MessagePort ? MessagePortEventMap
                                    : Target extends EventSource ? EventSourceEventMap
                                      : Target extends WebSocket ? WebSocketEventMap
                                        : Target extends Worker ? WorkerEventMap
                                          : Target extends XMLHttpRequest ? XMLHttpRequestEventMap
                                            : Record<string, Event>;

/** Event names that can be listened to on `Target`. */
export type EventTypeOf<Target extends EventTarget> = keyof EventMapOf<Target> & string;

/** The event object dispatched for event `Type` on `Target`. */
export type EventOf<Target extends EventTarget, Type extends EventTypeOf<Target>> = EventMapOf<Target>[Type];

/** Configuration options for {@link useEventListener}. */
export type UseEventListenerOptions<Target extends EventTarget, Type extends EventTypeOf<Target>> = AddEventListenerOptions & {
  /**
   * The event target to listen on, a ref object holding one, or `null` / `undefined`
   * to attach nothing.
   */
  target: Target | RefObject<Target | null> | null | undefined;
  /** The event name to listen for. */
  type: Type;
  /** The function invoked with the dispatched event. */
  listener: (event: EventOf<Target, Type>) => void;
};

/**
 * A React hook that subscribes to a DOM event on a target for the lifetime of the component.
 *
 * The listener is added in an effect and removed on cleanup, so nothing leaks when the
 * component unmounts. The latest `listener` is always invoked without re-subscribing,
 * so an inline arrow function can be passed on every render. The subscription is only
 * re-created when `target`, `type`, or one of the `addEventListener` options changes.
 *
 * When `target` is `null` or `undefined`, no listener is attached. This makes it safe to
 * pass globals that may be missing, such as `globalThis.navigation` in browsers that don't
 * support the Navigation API or during server-side rendering.
 *
 * When `target` is a ref object, its `current` value is read when the effect runs. A ref
 * that later points at a different element does not re-subscribe on its own.
 *
 * The event name and event object types are inferred from `target` for common targets
 * such as `Window`, `Document`, `HTMLElement`, and `Navigation`. Unknown targets accept
 * any event name and receive a plain `Event`.
 *
 * @template Target - The type of the event target.
 * @template Type - The event name, constrained to the events `Target` dispatches.
 *
 * @param options - Configuration including the target, event name, listener, and
 *   optional `addEventListener` options (`capture`, `once`, `passive`, `signal`).
 *
 * @example
 * Listening on a DOM element through a ref:
 * ```tsx
 * import { useEventListener } from '@praha/react-kit';
 * import { useRef } from 'react';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC = () => {
 *   const ref = useRef<HTMLDivElement>(null);
 *
 *   useEventListener({
 *     target: ref,
 *     type: 'pointermove',
 *     listener: (event) => {
 *       console.log(event.clientX, event.clientY);
 *     },
 *   });
 *
 *   return <div ref={ref}>Move the pointer here</div>;
 * };
 * ```
 *
 * @example
 * Listening on an arbitrary event target with options:
 * ```tsx
 * import { useEventListener } from '@praha/react-kit';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC<{ channel: BroadcastChannel }> = ({ channel }) => {
 *   useEventListener({
 *     target: channel,
 *     type: 'message',
 *     listener: (event) => {
 *       console.log(event.data);
 *     },
 *     passive: true,
 *   });
 *
 *   return null;
 * };
 * ```
 */
export const useEventListener = <Target extends EventTarget, Type extends EventTypeOf<Target>>({
  target,
  type,
  listener,
  capture,
  once,
  passive,
  signal,
}: UseEventListenerOptions<Target, Type>): void => {
  const onEvent = useEffectEvent(listener);

  useEffect(() => {
    const eventTarget = target instanceof EventTarget ? target : target?.current;
    if (!eventTarget) return;

    const handler = (event: Event) => onEvent(event as EventOf<Target, Type>);
    const options: AddEventListenerOptions = {};
    if (capture !== undefined) options.capture = capture;
    if (once !== undefined) options.once = once;
    if (passive !== undefined) options.passive = passive;
    if (signal !== undefined) options.signal = signal;

    eventTarget.addEventListener(type, handler, options);
    return () => eventTarget.removeEventListener(type, handler, options);
  }, [target, type, capture, once, passive, signal]);
};

/** Configuration options for {@link useWindowEventListener}. */
export type UseWindowEventListenerOptions<Type extends EventTypeOf<Window>> = Omit<UseEventListenerOptions<Window, Type>, 'target'>;

/**
 * A React hook that subscribes to an event on `window` for the lifetime of the component.
 *
 * A convenience wrapper around {@link useEventListener} that automatically uses `globalThis.window`
 * as the target, with event names and event objects typed from `WindowEventMap`. During server-side
 * rendering, where `window` is missing, no listener is attached.
 *
 * @template Type - The event name, constrained to the events `window` dispatches.
 *
 * @param options - Configuration including the event name, listener, and optional
 *   `addEventListener` options. The `target` option is omitted — `window` is used implicitly.
 *
 * @example
 * ```tsx
 * import { useWindowEventListener } from '@praha/react-kit';
 * import { useState } from 'react';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC = () => {
 *   const [width, setWidth] = useState(() => window.innerWidth);
 *
 *   useWindowEventListener({
 *     type: 'resize',
 *     listener: () => {
 *       setWidth(window.innerWidth);
 *     },
 *   });
 *
 *   return <div>Width: {width}</div>;
 * };
 * ```
 */
export const useWindowEventListener = <Type extends EventTypeOf<Window>>(
  options: UseWindowEventListenerOptions<Type>,
): void => {
  useEventListener<Window, Type>({
    ...options,
    target: globalThis.window,
  });
};

/** Configuration options for {@link useNavigationEventListener}. */
export type UseNavigationEventListenerOptions<Type extends EventTypeOf<Navigation>> = Omit<UseEventListenerOptions<Navigation, Type>, 'target'>;

/**
 * A React hook that subscribes to a Navigation API event for the lifetime of the component.
 *
 * A convenience wrapper around {@link useEventListener} that automatically uses `globalThis.navigation`
 * as the target, with event names and event objects typed from `NavigationEventMap`. In browsers
 * without the Navigation API, and during server-side rendering, `navigation` is missing and no
 * listener is attached.
 *
 * Use `'navigate'` to observe or intercept a navigation before it commits, and
 * `'currententrychange'` to react after the current history entry has changed. Note that
 * `'currententrychange'` also fires for `navigation.updateCurrentEntry()`, in which case
 * `event.navigationType` is `null`; check it if only real navigations matter to you.
 *
 * @template Type - The event name, constrained to the events `navigation` dispatches.
 *
 * @param options - Configuration including the event name, listener, and optional
 *   `addEventListener` options. The `target` option is omitted — `navigation` is used implicitly.
 *
 * @example
 * Blocking navigation while there are unsaved changes:
 * ```tsx
 * import { useNavigationEventListener } from '@praha/react-kit';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC<{ dirty: boolean }> = ({ dirty }) => {
 *   useNavigationEventListener({
 *     type: 'navigate',
 *     listener: (event) => {
 *       if (dirty && event.cancelable) event.preventDefault();
 *     },
 *   });
 *
 *   return null;
 * };
 * ```
 *
 * @example
 * Reacting after the page has navigated:
 * ```tsx
 * import { useNavigationEventListener } from '@praha/react-kit';
 *
 * import type { FC } from 'react';
 *
 * const Component: FC<{ onNavigated: () => void }> = ({ onNavigated }) => {
 *   useNavigationEventListener({
 *     type: 'currententrychange',
 *     listener: (event) => {
 *       if (event.navigationType === null) return;
 *       onNavigated();
 *     },
 *   });
 *
 *   return null;
 * };
 * ```
 */
export const useNavigationEventListener = <Type extends EventTypeOf<Navigation>>(
  options: UseNavigationEventListenerOptions<Type>,
): void => {
  useEventListener<Navigation, Type>({
    ...options,
    target: globalThis.navigation,
  });
};
