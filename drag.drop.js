import throttle from "lodash/throttle";

const isIE = navigator.userAgent.includes("Trident");
const isMac = navigator.userAgent.includes("Macintosh");

// when IE, bind pointer events, otherwise bind mouse and touch events
// note: Chrome(55+) supports pointer events, too.
// but to make it simpler, only use pointer events on IE
const eventTrigger = isIE
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

// make pointer/mouse/touch events the same for use
const normalizeEvent = e => {
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

const body = document.body;

const bind = (el, binding) => {
  // bind css for IE
  if (isIE) {
    Object.assign(el.style, {
      msTouchAction: "none",
      touchAction: "none",
      msScrollChaining: "none",
      msScrollLimit: "0 0 0 0"
    });
  }

  const callbacks = binding.value;

  let previousEvent;
  let downEvent;

  const handleEventDown = e => {
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

  const handleEventMove = throttle(e => {
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

  const handleEventUp = e => {
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

  const handleEvents = {
    down: handleEventDown,
    move: handleEventMove,
    up: handleEventUp
  };

  const bindEvents = (action, elem, captured = false) => {
    eventTrigger[action].forEach(type => {
      elem.addEventListener(type, handleEvents[action], captured);
    });
  };

  const unbindEvents = (action, elem, captured = false) => {
    eventTrigger[action].forEach(type => {
      elem.removeEventListener(type, handleEvents[action], captured);
    });
  };

  bindEvents("down", el, true);
};

export default {
  bind
};
