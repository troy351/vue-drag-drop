/**
 * This is a Vue directive used for drag.
 * Supports both mouse and touch event.
 * Compatible with IE 11 and above.
 *
 * Usage:
 * <element v-drag="DragCallback"></element>
 * to learn more about `DragCallback`, see definition codes below
 *
 * in `downcallback`, return false could abort this drag
 * in `upcallback`, return false could stop unbind `move` and `up` events
 */
import throttle from "lodash/throttle";
import { DirectiveFunction } from "vue";

export interface Dictionary<T> {
  [key: string]: T;
}

const isIE = navigator.userAgent.includes("Trident");
const isMac = navigator.userAgent.includes("Macintosh");

let dragging = false;

// when IE, bind pointer events, otherwise bind mouse and touch events
// note: Chrome(55+) supports pointer events, too.
// To make it simpler, only use pointer events on IE
const eventTrigger: Dictionary<string[]> = isIE
  ? {
      down: ["pointerdown"],
      move: ["pointermove"],
      up: ["pointerup"]
    }
  : {
      down: ["mousedown", "touchstart"],
      move: ["mousemove", "touchmove"],
      up: ["mouseup", "touchend"]
    };

export interface NormalizedEvent {
  x: number;
  y: number;
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
}

export interface Movement {
  // movement compare to previous move event
  x: number;
  y: number;
  // movement compare to down event
  mx: number;
  my: number;
  // pos of down event
  dx: number;
  dy: number;
}

export type UniEvent = MouseEvent | TouchEvent | PointerEvent;

export interface DragCallback {
  down?: (ne: NormalizedEvent, e: UniEvent) => boolean | void;
  move?: (movement: Movement, ne: NormalizedEvent, e: UniEvent) => void;
  up?: (isClick: boolean, ne: NormalizedEvent, e: UniEvent) => boolean | void;
  stop?: boolean;
  prevent?: boolean;
  capture?: boolean;
  // enable shift key to move vertically or horizontally
  shift?: boolean;
}

// make pointer/mouse/touch events the same for use
const normalizeEvent = (
  e: UniEvent,
  prevent: boolean = false,
  stop: boolean = false
): NormalizedEvent => {
  if (prevent) e.preventDefault();
  if (stop) e.stopPropagation();

  // note: there is no `TouchEvent` in IE, so check its existance first
  if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      shift: false,
      alt: false,
      ctrl: false,
      meta: false
    };
  }

  return {
    x: (e as MouseEvent | PointerEvent).clientX,
    y: (e as MouseEvent | PointerEvent).clientY,
    shift: e.shiftKey,
    alt: e.altKey,
    ctrl: isMac ? e.metaKey : e.ctrlKey,
    meta: isMac ? e.ctrlKey : e.metaKey
  };
};

const bind: DirectiveFunction = (el, binding) => {
  const callbacks: DragCallback = binding.value;

  let previousEvent: NormalizedEvent;
  let downEvent: NormalizedEvent;
  let direction: "x" | "y" | "";

  const handleEventDown = (e: UniEvent): void => {
    // important: should cancel throttle after event up
    handleEventMove.cancel();

    previousEvent = normalizeEvent(e, callbacks.prevent, callbacks.stop);
    downEvent = previousEvent;

    if (callbacks.down) {
      const result = callbacks.down(previousEvent, e);

      if (result === false) return;
    }

    // in handleEventUp, return false could prevent unbind events
    // you may think there could be multiple binding here.
    // actually, events with the same listener will only bind once
    // tslint:disable max-line-length
    // see at https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Multiple_identical_event_listeners
    // also, bind `move` and `up` events on window instead of `body` or `document`
    // this could make `move` and `up` works even user drag outside browser window
    bindEvents("move", window, callbacks.capture);
    bindEvents("up", window, callbacks.capture);
    dragging = true;
  };

  const handleEventMove = throttle((e: UniEvent) => {
    const ne = normalizeEvent(e, callbacks.prevent, callbacks.stop);

    let mx = ne.x - downEvent.x;
    let my = ne.y - downEvent.y;

    // deal with shift key
    if (callbacks.shift) {
      if (ne.shift) {
        // set a direction if not
        if (!direction) {
          direction = Math.abs(mx) > Math.abs(my) ? "x" : "y";
        }

        if (direction === "x") {
          my = 0;
          ne.y = downEvent.y;
        } else if (direction === "y") {
          mx = 0;
          ne.x = downEvent.x;
        }
      } else {
        // if shift key not pressed anymore, should reset direction
        direction = "";
      }
    }

    // note: modern browser support e.movementX & e.movementY as movement,
    // but IE & Safari doesn't support it so we need to calc it manually
    const x = ne.x - previousEvent.x;
    const y = ne.y - previousEvent.y;

    // Chrome bug: mousedown will trigger a mousemove event even if mouse doesn't move,
    // need to check if there is no movement, should not trigger move callback
    if (!x && !y) return;

    if (callbacks.move) {
      callbacks.move(
        {
          x,
          y,
          mx,
          my,
          dx: downEvent.x,
          dy: downEvent.y
        },
        ne,
        e
      );
    }

    previousEvent = ne;
  }, 60);

  const handleEventUp = (e: UniEvent) => {
    // clear direction
    direction = "";

    // important: should cancel throttle after event up
    handleEventMove.cancel();
    previousEvent = normalizeEvent(e, callbacks.prevent, callbacks.stop);

    // return current pos and isClick
    if (callbacks.up) {
      const result = callbacks.up(
        previousEvent.x === downEvent.x && previousEvent.y === downEvent.y,
        previousEvent,
        e
      );

      if (result === false) return;
    }

    unbindEvents("move", window, callbacks.capture);
    unbindEvents("up", window, callbacks.capture);
    dragging = false;
  };

  const handleEvents: Dictionary<(e: UniEvent) => void> = {
    down: handleEventDown,
    move: handleEventMove,
    up: handleEventUp
  };

  const bindEvents = (
    action: string,
    elem: HTMLElement | Window,
    capture: boolean = false
  ) => {
    eventTrigger[action].forEach((type: string) => {
      elem.addEventListener(
        type,
        handleEvents[action] as EventListener,
        capture
      );
    });
  };

  const unbindEvents = (
    action: string,
    elem: HTMLElement | Window,
    capture: boolean = false
  ) => {
    eventTrigger[action].forEach((type: string) => {
      elem.removeEventListener(
        type,
        handleEvents[action] as EventListener,
        capture
      );
    });
  };

  bindEvents("down", el, callbacks.capture);
};

export default {
  bind
};

/**
 * to check if there is anything dragging at current time
 */
export const isDragging = () => dragging;
