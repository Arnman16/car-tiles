<template>
  <div
    class="cantainer"
    v-touch:press="touchStart"
    v-touch:release="touchEnd"
    v-touch:swipe="swipeStop"
    ref="con"
  >
    <canvas class="canv" ref="can"></canvas>
  </div>
  <button @click="reset" class="reset-button">Reset</button>
  <button @click="tests" v-show="true" class="tests-button">
    {{ average }}
  </button>
  <div class="card score">
    <div class="container">
      <div class="text-md text-center">{{ timer }}</div>
      <span class="text-lg">Tiles remaining:</span>
      <div class="text-2xl text-center strong font-bold">
        {{ blocksRemaining }}
      </div>
    </div>
  </div>
  <div v-show="gameOver || blocksRemaining === 0" class="modal">
    <div class="modal-content" v-if="gameOver">
      <div class="modal-header text-xl by-2">
        <button @click="close" class="close">&times;</button>
        <h2>Game Over!</h2>
      </div>
      <div class="modal-body flex-wrap">
        <div class="text-lg text-center text-gray-500">
          You missed {{ blocksRemaining }} blocks!
        </div>
        <div class="text-lg text-center text-gray-500">
          Try again... maybe you'll make it to the high score list!
        </div>
        <div class="h-16 flex flex-wrap content-center justify-center">
          <button
            class="
              bg-blue-500
              hover:bg-blue-700
              text-white
              font-bold
              py-2
              px-4
              rounded-full
            "
            @click="reset"
          >
            TRY AGAIN!
          </button>
        </div>
      </div>
    </div>
    <div class="modal-content" v-else>
      <div class="modal-header text-xl by-2">
        <button @click="close" class="close">&times;</button>
        <h2>Winner!</h2>
      </div>
      <div class="modal-body flex-wrap">
        <div class="text-lg text-center text-gray-500">YOU WIN!</div>
        <div class="text-lg text-center text-gray-500">
          Play again... maybe you'll make it to the high score list!
        </div>
        <div class="h-16 flex flex-wrap content-center justify-center">
          <button
            class="
              bg-blue-500
              hover:bg-blue-700
              text-white
              font-bold
              py-2
              px-4
              rounded-full
            "
            @click="reset"
          >
            PLAY AGAIN!
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- <div class="intro" v-show="startFlag">Get all the tiles and don't fall!</div> -->
</template>

<script>
import { fabric } from "fabric";
import { ref, onMounted, watch } from "vue";
import {
  cEvent,
  cFunction,
  canvas,
  mouseOver,
  blocksRemaining,
  timer,
  gameOver,
  canvasCar,
  startFlag,
} from "./js/canvasEvents";
const debounce = require("lodash/debounce");
const throttle = require("lodash/throttle");
const isEmpty = require("lodash/isEmpty");

export default {
  setup() {
    const con = ref(null); // canvas container ref
    const can = ref(null); // canvas ref
    let modal = ref(null);
    const y = ref(100);
    const animationId = ref({});
    const forward = () => {};
    watch(canvasCar, (value) => {
      console.log(animationId.value);
      window.cancelAnimationFrame(animationId.value);
      if (!isEmpty(value)) {
        console.log("start animation");
        animationId.value = window.requestAnimationFrame(animate);
        console.log(animationId.value);
      }
    });
    const options = {
      acceleration: 1.03,
      deceleration: 0.97,
      brakeDeceleration: 0.8,
      maxSpeed: 40,
      maxReverseSpeed: 12,
      stickySteering: 1,
    };
    const reverse = throttle(() => {}, 30);
    let stickySteering = options.stickySteering;
    const left = throttle(() => {
      if (canvas.car.angle !== undefined) {
        if (canvas.car.angle % 90 === 0 && stickySteering > 0) {
          stickySteering--;
        } else {
          canvas.car.angle -= 5;
          stickySteering = options.stickySteering;
        }
      } else canvas.car.angle = 255;
      // canvas.renderAll();
    }, 30);
    const right = throttle(() => {
      if (canvas.car.angle !== undefined) {
        if (canvas.car.angle % 90 === 0 && stickySteering > 0) {
          stickySteering--;
        } else {
          canvas.car.angle += 5;
          stickySteering = options.stickySteering;
        }
      } else canvas.car.angle = 5;
      // canvas.renderAll();
    }, 30);
    const add = () => {
      let newRect = new fabric.Rect({
        width: 100,
        height: 100,
        top: 100,
        originX: "center",
        originY: "center",
        y: 100,
        fill: "rgba(255,0,255,0.5)",
        __id: Math.random() * 1000000,
      });
      y.value += 50;
      newRect.left = y.value;
      newRect.top = y.value;
      canvas.add(newRect);
      // canvas.renderAll();
    };
    const tests = () => {
      console.log(canvas.__eventListeners);
      console.log(
        "Vpt: ",
        canvas.viewportTransform,
        con.value.clientWidth,
        con.value.clientHeight
      );
    };
    const close = () => {
      gameOver.value = false;
    };
    let velocity = () => {
      let go =
        controller.value["ArrowUp"].pressed ||
        controller.value["w"].pressed ||
        touch.up;
      let brake =
        controller.value["ArrowDown"].pressed || controller.value["s"].pressed;
      if (go && !canvas.gameOver) {
        if (canvas.car.currentSpeed === 0) {
          canvas.car.currentSpeed = 2;
        } else {
          canvas.car.currentSpeed *= options.acceleration;
          if (canvas.car.currentSpeed > options.maxSpeed) {
            canvas.car.currentSpeed = options.maxSpeed;
          }
        }
      } else {
        if (canvas.car.currentSpeed < 0.5) canvas.car.currentSpeed = 0;
        brake || canvas.gameOver
          ? (canvas.car.currentSpeed *= options.brakeDeceleration)
          : (canvas.car.currentSpeed *= options.deceleration);
      }
    };
    const moveForward = throttle(() => {
      if (!canvas._objects[0]) return;
      if (!canvas.backgroundImage) return;

      velocity();
      if (!canvas.car) return;
      if (canvas.car.currentSpeed === 0) return;
      let y =
        Math.cos((Math.PI / 180) * canvas.car.angle) *
        canvas.car.currentSpeed *
        -1;
      let x =
        Math.sin((Math.PI / 180) * canvas.car.angle) * canvas.car.currentSpeed;
      canvas.car.left += x;
      canvas.car.top += y;
      if (canvas.car.left < 100) canvas.car.left = 100;
      if (canvas.car.top < 100) canvas.car.top = 100;
      if (canvas.car.left > canvas.backgroundImage.width - 100)
        canvas.car.left = canvas.backgroundImage.width - 100;
      if (canvas.car.top > canvas.backgroundImage.height - 100)
        canvas.car.top = canvas.backgroundImage.height - 100;
      cFunction.setView();
      canvas.car.setCoords();
      // canvas.renderAll();
    }, 15);
    const controller = ref({
      ArrowUp: { pressed: false, func: forward },
      ArrowDown: { pressed: false, func: reverse },
      ArrowLeft: { pressed: false, func: left },
      ArrowRight: { pressed: false, func: right },
      w: { pressed: false, func: forward },
      s: { pressed: false, func: reverse },
      a: { pressed: false, func: left },
      d: { pressed: false, func: right },
    });
    let time = 0;
    let average = ref({});
    let samples = [];

    const animate = (timeStamp) => {
      let fps = 1000 / (timeStamp - time);
      samples.push(fps);
      if (samples.length > 60) samples.shift();
      let sum = 0;
      samples.forEach((sample) => {
        sum += sample;
      });
      average.value = `${(sum / samples.length).toFixed(1)} fps`;
      // console.log("fps: ", average.value);
      time = timeStamp;

      if (canvas && canvas.car) {
        runPressedButtons();
      }
      animationId.value = window.requestAnimationFrame(animate);
      canvas.renderAll();
    };
    onMounted(() => {
      cEvent.setCanvas(can.value, con.value);
      canvas.renderAll();
      console.log(canvas);
      window.addEventListener("resize", () => {
        resizeCanvas();
      });
      resizeCanvas();
      window.addEventListener("keydown", (e) => {
        if (controller.value[e.key]) {
          controller.value[e.key].pressed = true;
        }
        e.preventDefault();
        e.stopPropagation();
      });
      window.addEventListener("keyup", (e) => {
        if (controller.value[e.key]) {
          controller.value[e.key].pressed = false;
        }
        if (gameOver.value && e.key === "Enter") {
          cFunction.reset();
        }
        e.preventDefault();
        e.stopPropagation();
      });
    });
    const resizeCanvas = debounce(() => {
      if (!con.value || !canvas) return;
      canvas.setDimensions({
        width: con.value.clientWidth,
        height: con.value.clientHeight,
      });
      canvasCar.value.top = 500;
      canvasCar.value.left = 500;
    }, 200);
    const runPressedButtons = () => {
      Object.keys(controller.value).forEach((key) => {
        if (controller.value[key].pressed) {
          controller.value[key].func();
        }
        if (touch.left) left();
        if (touch.right) right();
      });
      moveForward();
    };
    let touch = {
      x: null,
      y: null,
      up: false,
      down: false,
      left: false,
      right: false,
    };
    const touchStart = (e) => {
      console.log("Touch Start", e, e.touches.length);
      touch.left = false;
      touch.right = false;
      touch.up = true;
    };
    const touchEnd = (e) => {
      console.log("Touch End", e);
      let middle = con.value.clientWidth / 2;
      if (e.touches.length === 1) {
        if (e.touches[0].clientX > middle) {
          touch.left = false;
          touch.right = true;
        } else {
          touch.left = true;
          touch.right = false;
        }
      } else {
        touch.up = false;
        touch.down = false;
        touch.left = false;
        touch.right = false;
        touch.x = null;
        touch.y = null;
      }
    };
    const swipeStop = () => {
      touch.up = false;
    };
    return {
      con,
      can,
      add,
      average,
      canvas,
      controller,
      resizeCanvas,
      forward,
      left,
      right,
      mouseOver,
      gameOver,
      tests,
      reset: cFunction.reset,
      remove: cFunction.remove,
      blocksRemaining,
      modal,
      close,
      timer,
      canvasCar,
      startFlag,
      touchStart,
      touchEnd,
      swipeStop,
      // ...canvasEvents,
    };
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/* @import 'tailwindcss/utilities'; */

.cantainer {
  height: 100vh;
  width: 100vw;
  position: fixed !important;
  left: 0px;
  right: 0px;
  z-index: -1;
}
.reset-button {
  z-index: 0;
  position: fixed !important;
  top: 30px;
  right: 30px;
  opacity: 0.7;
  @apply bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full;
}
.tests-button {
  @apply bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4;
  z-index: 0;
  position: fixed !important;
  bottom: 30px;
  right: 30px;
  opacity: 0.3;
}
.score {
  z-index: 0;
  background-color: rgba(10, 10, 10, 0.5);
  position: fixed !important;
  left: 30px;
  top: 30px;
}
.card {
  /* Add shadows to create the "card" effect */
  user-select: none;
  color: white;
  box-shadow: 0 0 10px 10px rgba(10, 10, 10, 0.5s);
}

/* Add some padding inside the card container */
.container {
  padding: 4px 16px;
}
.modal {
  display: block; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  left: 0;
  top: 0;
  color: white;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0, 0, 0); /* Fallback color */
  background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
}

/* Modal Header */
.modal-header {
  padding: 2px 16px;
  background-color: #1e2122;
  color: white;
}

/* Modal Body */
.modal-body {
  padding: 2px 16px;
}

/* Modal Footer */
.modal-footer {
  padding: 2px 16px;
  background-color: #5cb85c;
  color: white;
}

/* Modal Content */
.modal-content {
  position: relative;
  background-color: #fefefe;
  margin: auto;
  padding: 0;
  border: 1px solid #888;
  width: 80%;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  animation-name: animatetop;
  animation-duration: 0.8s;
}

/* Add Animation */
@keyframes animatetop {
  from {
    top: -300px;
    opacity: 0;
  }
  to {
    top: 0;
    opacity: 1;
  }
}

/* The Close Button */
.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
.intro {
  position: fixed;
  left: 30vw;
  top: 32vh;
  max-width: 40;
  color: whitesmoke;
  font-size: 2rem;
}
</style>
