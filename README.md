# vue-drag-drop

A Vue.js directive that providing drag and drop capability, both mouse and touch are supported.
Compatible with IE 10+

### Install

use `drag.drop.js` for JavaScript users,
use `drag.drop.ts` for TypeScript users

### Advantage

Compare to [vue-drag-and-drop](https://github.com/james2doyle/vue-drag-and-drop).
This library use MouseEvent and TouchEvent (for IE 10+ using PointerEvent), so it can support both mouse and touch events.

### Usage

```html
<template>
    <div v-drag-drop="handler"
         style="width:100px;height:100px;background:black;position:absolute;"
         :style="{left:x+'px', top:y+'px'}">
    </div>
</template>

<script>
import DragDrop, { isDragging } from "./drag.drop";

export default {
  directives: {
    DragDrop,
  },
  data() {
    return {
      x: 0,
      y: 0,
    };
  },
  computed: {
    handler() {
      return {
        down: this.down,
        move: this.move,
        up: this.up,
        stop: true, // stopPropagation or not, default false
        prevent: true, // preventDefault or not, default false
        capture: true, // use captured or not, default false
        shift: false   // allow press shift key to move vertically or horizontally
      };
    },
  },
  methods: {
    down(ne, e) {
      // hander here
    },
    move(movement, ne, e) {
      // hander here
      this.x += movement.x;
      this.y += movement.y;
    },
    up(isClick, ne, e) {
      // hander here
    },
    someMethods() {
      if (isDragging()) {
        // do something here only if something is being dragged
      }
    }
  },
};
</script>
```

### Doc

**see the TypeScript version for more details**

- `e`: the original event, depending on which event triggered
- `ne`: NormalizedEvent, make MouseEvent/TouchEvent/PointerEvent all the same format, see detail below

```TypeScript
export interface NormalizedEvent {
  x: number; // clientX
  y: number; // clientY
  shift: boolean; // shift key pressed
  alt: boolean; // alt key pressed
  ctrl: boolean; // ctrl key pressed (on macOS is meta key)
  meta: boolean; // meta key pressed (on macOS is ctrl key)
}
```

- `movement`: the movement, see detail below

```TypeScript
export interface Movement {
  x: number; // movementX, compared to the previous move event
  y: number; // movementY, compared to the previous move event
  mx: number; // movementX, compared to down event
  my: number; // movementY, compared to down event
  dx: number; // downX, x of down event
  dy: number; // downY, y of down event
}
```

- `isClick`: actually moved or not, `true` stands for click

### Tips

in `down` handler, you can `return false` to cancel the drag
in `up` handler, you can `return false` to cancel unbind drag
