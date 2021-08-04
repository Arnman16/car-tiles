import { reactive, ref } from 'vue'
import { fabric } from "fabric";
const throttle = require("lodash/throttle")
const gridBg = require("../../assets/grid.svg")
// const car = require("../../assets/car.png")
const car = require("../../assets/car5.png");
const pavement1 = require("../../assets/pavement1.png");
const pavement2 = require("../../assets/pavement2.png");
let timer = ref("");
let gameOver = ref(false);
let startFlag = true;
let canvas = reactive({});
let currentSquare = null;
let blocksRemaining = ref(99);
const canvasCar = ref({});
let conHolder = {};
// let canHolder = {};
const mouseOver = reactive({ isTarget: false, target: null });
const cEvent = {
  setCanvas(can, con) {
    fabric.Object.prototype.objectCaching = false;
    conHolder = con;
    // canHolder = can;
    canvas = reactive(new fabric.Canvas(can, {
      fireRightClick: true,
      fireMiddleClick: true,
      stopContextMenu: true,
    }));
    canvas.objectSelected = null;
    canvas.centeredScaling = true;
    canvas.selection = false;
    canvas.objectCaching = false;
    gameOver.value = false;
    canvas.setBackgroundImage(gridBg, canvas.renderAll.bind(canvas));
    canvas.on("after:render", () => {
      this.afterRender();
    });
    this.setObjects();
  },
  setObjects() {
    fabric.Image.fromURL(
      car,
      function (myImg) {
        var shadow = new fabric.Shadow({
          color: "rgba(255,255,255, 0.25)",
          blur: 200,
          offsetX: 0,
          offsetY: 0,
        });
        canvas.car = myImg;
        canvas.add(myImg.set({
          // scaleY: 0.5,
          // scaleX: 0.5,
          originX: "center",
          originY: "center",
          shadow: shadow,
          angle: 90,
          opacity: 0.98,
          objectCaching: false,
          selectable: false,
          evented: false,
          dirty: true,
        }));
        canvas.car.top = conHolder.clientHeight / 2;
        canvas.car.left = conHolder.clientWidth / 2;
        canvas.car.currentSpeed = 0;
        canvas.car.lastSpeed = 0;
        canvas.car.setCoords();
        canvasCar.value = canvas.car;
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      });
    this.setSquares();
    reset();
    startFlag = true;
    print("00:00:00");
  },
  setSquares() {
    let square = {
      width: 1000,
      height: 1000,
      fill: "white",
      opacity: 0.5,
      objectCaching: false,
      dirty: true,
      selectable: false,
      centeredScaling: true,
      originX: "center",
      originY: "center",
      top: 500,
      left: 500,
      evented: false,
      death: false,
      tod: null,
    }
    let count = 0;
    let notFirst = false;
    while (square.top < 10000) {
      square.left = 500;
      while (square.left < 10000) {
        count++;
        if (notFirst) {
          const sObj = new fabric.Rect(square);
          sObj.set('fill', new fabric.Pattern({
            source: (count % 2 === 0) ? pavement1 : pavement2,
            repeat: "repeat",
          }));
          canvas.add(sObj);
          // sObj.setCoords();
        }
        notFirst = true;
        square.left += 1000;
      }
      square.top += 1000;
      count++;
    }
    canvas.renderAll();
  },
  mouseUp(opt) {
    console.log("mouse up", opt);
    canvas.isDragging = false;
    canvas.isPanning = false;
  },
  mouseDown(opt) {
    console.log("mouse down", opt);
    var evt = opt.e;
    canvas.isDragging = true;
    if (evt.button === 2 || evt.altKey === true) {
      canvas.isPanning = true;
      canvas.lastPosX = evt.clientX;
      canvas.lastPosY = evt.clientY;
    }
  },
  mouseMove(opt) {
    // console.log("mouse move", opt);
    if (canvas.isPanning) {
      var vpt = canvas.viewportTransform;
      var e = opt.e;
      vpt[4] += e.clientX - canvas.lastPosX;
      vpt[5] += e.clientY - canvas.lastPosY;
      canvas.requestRenderAll();
      canvas.lastPosX = e.clientX;
      canvas.lastPosY = e.clientY;
    }
  },
  mouseWheel(opt) {
    console.log("mouse wheel", opt);
    var delta = opt.e.deltaY;
    var zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.05) zoom = 0.05;
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  },
  mouseOver(opt) {
    console.log("mouse over", opt, opt.target);
    if (opt.target) {
      mouseOver.isTarget = true;
      mouseOver.target = opt.target;
    }
  },
  mouseOut(opt) {
    console.log("mouse out", opt);
    mouseOver.isTarget = false;
    mouseOver.target = null;
  },
  selectionCreated(opt) {
    console.log("selection created", opt);
    canvas.objectSelected = opt.selected;
  },
  selectionCleared(opt) {
    console.log("selection cleared", opt);
    canvas.objectSelected = null;
  },
  selectionUpdated(opt) {
    console.log("selection updated", opt);
    canvas.objectSelected = opt.selected;
  },
  pathCreated(opt) {
    console.log("math created", opt);
  },
  objectMoving(opt) {
    console.log("object moving", opt);

  },
  objectMoved(opt) {
    console.log("object moved", opt);
  },
  objectRotating(opt) {
    console.log("object rotating", opt);
  },
  objectScaling(opt) {
    console.log("object scaling", opt);
  },
  objectModified(opt) {
    console.log("object modified", opt);
  },
  afterRender: throttle(() => {
    if (!canvas.car || gameOver.value) return;
    let timeNow = Date.now();
    canvas.forEachObject((obj) => {
      if (canvas.car.intersectsWithObject(obj) && obj !== canvas.car && obj !== currentSquare) {
        if (obj.tod && (timeNow - obj.tod > 2000)) {
          pause();
          gameOver.value = true;
          canvas.car.set({ opacity: 0.8, scaleX: 0.9, scaleY: 0.9 });
          canvas.car.animate({ scaleX: 0.001, scaleY: 0.001, opacity: 0 }, {
            onChange: canvas.renderAll.bind(canvas),
          });
        }
        else if (timeNow - obj.tod < 2000) {
          console.log("too soon");
        }
        else {
          obj.death = true;
          obj.tod = Date.now();
          currentSquare = obj;
          blocksRemaining.value--;
          obj.animate({ opacity: 0, scaleX: 0.8, scaleY: 0.8, }, { onChange: canvas.renderAll.bind(canvas) });
          // obj.animate("opacity", 1, {
          //   onChange: canvas.renderAll.bind(canvas),
          // });
        }
      }
    })
  }, 200)
}
const cFunction = {
  remove() {
    if (!canvas.objectSelected) return
    let targets = canvas.objectSelected;
    targets.forEach(target => {
      canvas.remove(target);
    });
    canvas.objectSelected = null;
    canvas.discardActiveObject();
  },
  reset() {
    canvas.forEachObject((obj) => {
      canvas.remove(obj);
    });
    // canvas.clear();
    gameOver.value = false;
    canvas.car.currentSpeed = 0;
    canvas.car.lastSpeed = 0;
    cEvent.setObjects();
    currentSquare = null;
    blocksRemaining.value = 99;
  },
  setView() {
    if (startFlag) {
      start();
      startFlag = false;
    }
    let zoom = 0.02 * (canvas.car.lastSpeed - canvas.car.currentSpeed);
    zoom += canvas.getZoom();
    let newLeft = (-canvas.car.left * zoom) + conHolder.clientWidth / 2;
    let newTop = (-canvas.car.top * zoom) + conHolder.clientHeight / 2;
    canvas.setViewportTransform([zoom, 0, 0, zoom, newLeft, newTop]);
    canvas.requestRenderAll();
    canvas.car.lastSpeed = canvas.car.currentSpeed;
  }
}
// Convert time to a format of hours, minutes, seconds, and milliseconds

function timeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  let diffInMs = (diffInSec - ss) * 100;
  let ms = Math.floor(diffInMs);

  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");
  let formattedMS = ms.toString().padStart(2, "0");

  return `${formattedMM}:${formattedSS}:${formattedMS}`;
}
// Declare variables to use in our functions below

let startTime;
let elapsedTime = 0;
let timerInterval;

// Create function to modify innerHTML

function print(txt) {
  timer.value = txt;
}

// Create "start", "pause" and "reset" functions

function start() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(function printTime() {
    elapsedTime = Date.now() - startTime;
    print(timeToString(elapsedTime));
  }, 10);
}

function pause() {
  clearInterval(timerInterval);
}

function reset() {
  clearInterval(timerInterval);
  print("00:00:00");
  elapsedTime = 0;
}
export {
  canvas, cEvent, cFunction, mouseOver, blocksRemaining, timer, gameOver, canvasCar,
}
