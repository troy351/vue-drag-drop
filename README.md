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
import DragDrop from "./drag.drop";

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
    up(moved, ne, e) {
      // hander here
    },
  },
};
</script>
```

### Doc

**see the TypeScript version for more details**

* `e`: the original event, depending on which event triggered
* `ne`: NormalizedEvent, make MouseEvent/TouchEvent/PointerEvent all the same format, see detail below
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
* `movement`: the movement compared to the previous move event, see detail below
```TypeScript
export interface Movement {
  x: number; // movementX
  y: number; // movementY
}
```
* `moved`: actually moved or not, `false` stands for click

### Tips

in `down` handler, you can `return false` to cancel the drag
