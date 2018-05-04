import throttle from "lodash/throttle";
import { DirectiveFunction } from "vue";

export interface Dictionary<T> {
  [key: string]: T;
}

const isIE = navigator.userAgent.includes("Trident");
const isMac = navigator.userAgent.includes("Macintosh");

// when IE, bind pointer events, otherwise bind mouse and touch events
// note: Chrome(55+) supports pointer events, too.
// but to make it simpler, only use pointer events on IE
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

export interface Pos {
  x: number;
  y: number;
}

export type UniEvent = MouseEvent | TouchEvent | PointerEvent;

export interface DragDropCallback {
  down?: (ne: NormalizedEvent, e: UniEvent) => boolean | void;
  move?: (movement: Pos, ne: NormalizedEvent, e: UniEvent) => void;
  up?: (moved: boolean, ne: NormalizedEvent, e: UniEvent) => void;
}

// make pointer/mouse/touch events the same for use
const normalizeEvent = (e: UniEvent): NormalizedEvent => {
  e.preventDefault();
  e.stopPropagation();

  if (e instanceof TouchEvent) {
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
    x: e.clientX,
    y: e.clientY,
    shift: e.shiftKey,
    alt: e.altKey,
    ctrl: isMac ? e.metaKey : e.ctrlKey,
    meta: isMac ? e.ctrlKey : e.metaKey
  };
};

const body: HTMLElement = document.body;

const bind: DirectiveFunction = (el, binding) => {
  // bind css for IE
  if (isIE) {
    Object.assign(el.style, {
      msTouchAction: "none",
      touchAction: "none",
      msScrollChaining: "none",
      msScrollLimit: "0 0 0 0"
    });
  }

  const callbacks: DragDropCallback = binding.value;

  let previousEvent: NormalizedEvent;
  let downEvent: NormalizedEvent;

  const handleEventDown = (e: UniEvent): void => {
    previousEvent = normalizeEvent(e);
    downEvent = previousEvent;

    if (callbacks.down) {
      const result = callbacks.down(previousEvent, e);

      if (result === false) {
        return;
      }
    }

    bindEvents("move", body, true);
    bindEvents("up", body, true);
  };

  const handleEventMove = throttle((e: UniEvent) => {
    const ne = normalizeEvent(e);

    // note: modern browser support e.movementX & e.movementY as movement,
    // but IE & Safari doesn't support it so we need to calc it manually
    if (callbacks.move) {
      callbacks.move(
        {
          x: ne.x - previousEvent.x,
          y: ne.y - previousEvent.y
        },
        ne,
        e
      );
    }

    previousEvent = ne;
  }, 60);

  const handleEventUp = (e: UniEvent) => {
    // important: should cancel throttle after event up
    handleEventMove.cancel();

    previousEvent = normalizeEvent(e);

    // return current pos and isClick
    if (callbacks.up) {
      callbacks.up(
        previousEvent.x === downEvent.x && previousEvent.y === downEvent.y,
        previousEvent,
        e
      );
    }

    unbindEvents("move", body, true);
    unbindEvents("up", body, true);
  };

  const handleEvents: Dictionary<(e: UniEvent) => void> = {
    down: handleEventDown,
    move: handleEventMove,
    up: handleEventUp
  };

  const bindEvents = (
    action: string,
    elem: HTMLElement,
    captured: boolean = false
  ) => {
    eventTrigger[action].forEach((type: string) => {
      elem.addEventListener(
        type,
        handleEvents[action] as EventListener,
        captured
      );
    });
  };

  const unbindEvents = (
    action: string,
    elem: HTMLElement,
    captured: boolean = false
  ) => {
    eventTrigger[action].forEach((type: string) => {
      elem.removeEventListener(
        type,
        handleEvents[action] as EventListener,
        captured
      );
    });
  };

  bindEvents("down", el, true);
};

export default {
  bind
};
