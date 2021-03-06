import { reactive, ref } from "vue";
import { fabric } from "fabric";
import { scoreCollection, firebase } from "./db";
const throttle = require("lodash/throttle");
const gridBg = require("../../assets/grid.svg");
const car = require("../../assets/car.svg");
const pavement1 = require("../../assets/pavement1.jpg");
const pavement2 = require("../../assets/pavement2.jpg");
const pavement3 = require("../../assets/pavement3.jpg");
let timer = ref("");
let gameOver = ref(false);
let startFlag = ref(true);
let canvas = reactive({});
let currentSquare = null;
const youWin = ref(false);
let blocksRemaining = ref(99);
const canvasCar = ref({});
const scores = ref({});
const scoreId = ref("");
const position = ref("");
const averageFps = ref({});
let isGameOver = false;

let conHolder = {};
let startTime;
let elapsedTime = 0;
let timerInterval;
// let canHolder = {};

const mouseOver = reactive({ isTarget: false, target: null });
const cEvent = {
  setCanvas(can, con) {
    fabric.Object.prototype.objectCaching = false;
    conHolder = con;
    // canHolder = can;
    canvas = reactive(
      new fabric.Canvas(can, {
        fireRightClick: true,
        fireMiddleClick: true,
        stopContextMenu: true,
        renderOnAddRemove: false,
      })
    );
    canvas.objectSelected = null;
    canvas.centeredScaling = true;
    canvas.selection = false;
    canvas.objectCaching = false;
    gameOver.value = false;
    isGameOver = false;
    canvas.setBackgroundImage(gridBg, canvas.renderAll.bind(canvas));
    canvas.on("after:render", () => {
      this.afterRender();
    });
    this.setObjects();
    this.setSquares();
  },
  setObjects() {
    fabric.Image.fromURL(car, function(myImg) {
      var shadow = new fabric.Shadow({
        color: "rgba(255,255,255, 0.25)",
        blur: 200,
        offsetX: 0,
        offsetY: 0,
      });
      canvas.car = myImg;
      canvas.add(
        myImg.set({
          scaleY: 1.5,
          scaleX: 1.5,
          originX: "center",
          originY: "center",
          shadow: shadow,
          angle: 90,
          // opacity: 0.98,
          objectCaching: false,
          selectable: false,
          hasControls: false,
          evented: false,
          dirty: true,
        })
      );
      canvas.car.top = 500;
      canvas.car.left = 500;
      canvas.car.currentSpeed = 0;
      canvas.car.lastSpeed = 0;
      canvas.car.setCoords();
      let isMobile = conHolder.clientHeight > conHolder.clientWidth;
      let introText = new fabric.Text(
        "Objectives: \n  ??? Get the tiles\n  ??? Don't fall!\nControls: \n  ????????????  or  WASD"
      ).set({
        top: canvas.car.top - (isMobile ? 240 : 320),
        left: canvas.car.left - 160,
        fill: "white",
        selectable: false,
        evented: false,
        hasControls: false,
        dirty: true,
        objectCaching: false,
        scaleX: isMobile ? 0.7 : 1,
        scaleY: isMobile ? 0.7 : 1,
        opacity: 1,
      });
      canvas.introText = introText;
      canvas.add(introText);
      canvasCar.value = canvas.car;
      let w = conHolder.clientWidth / 2 - 500;
      let h = conHolder.clientHeight / 2 - 500;
      canvas.setViewportTransform([1, 0, 0, 1, w, h]);
    });
    reset();
    startFlag.value = true;
    print("00:00:000");
  },
  instawin() {
    blocksRemaining.value = 0;
    this.winner();
  },
  setGameOver() {
    gameOver.value = true;
  },
  winner() {
    pause();
    youWin.value = true;
    setTimeout(this.setGameOver, 700);
    isGameOver = true;
    cFunction.fetchScores();
    canvas.forEachObject((obj) => {
      if (obj !== canvas.car && obj !== canvas.introText) {
        obj.opacity = 1;
        obj.scaleY = 1;
        obj.scaleX = 1;
        obj.death = false;
        obj.set(
          "fill",
          new fabric.Pattern({
            source: pavement3,
            repeat: "repeat",
          })
        );
      }
    });
  },
  setSquares() {
    let square = {
      width: 1000,
      height: 1000,
      // fill: "white",
      // opacity: 0.5,
      objectCaching: false,
      dirty: true,
      selectable: false,
      hasControls: false,
      centeredScaling: true,
      hasRotatingPoint: false,
      originX: "center",
      originY: "center",
      top: 500,
      left: 500,
      evented: false,
      death: false,
      tod: null,
    };
    let count = 0;
    let notFirst = false;
    while (square.top < 10000) {
      square.left = 500;
      while (square.left < 10000) {
        count++;
        if (notFirst) {
          const sObj = new fabric.Rect(square);
          sObj.set(
            "fill",
            new fabric.Pattern({
              source: count % 2 === 0 ? pavement1 : pavement2,
              repeat: "repeat",
            })
          );
          canvas.add(sObj);
          // sObj.setCoords();
        }
        notFirst = true;
        square.left += 1000;
      }
      square.top += 1000;
      count++;
    }
    // canvas.renderAll();
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
      // canvas.requestRenderAll();
      canvas.lastPosX = e.clientX;
      canvas.lastPosY = e.clientY;
    }
  },
  afterRender: throttle(() => {
    if (!canvas.car || isGameOver || youWin.value) return;
    if (blocksRemaining.value === 0) {
      cEvent.winner();
      return;
    }
    let timeNow = Date.now();
    canvas.forEachObject((obj) => {
      if (
        canvas.car.intersectsWithObject(obj) &&
        obj !== canvas.car &&
        obj !== currentSquare &&
        obj !== canvas.introText
      ) {
        if (obj.tod && timeNow - obj.tod > 2000) {
          pause();
          setTimeout(cEvent.setGameOver, 700);
          isGameOver = true;
          canvas.car.set({ opacity: 0.8, scaleX: 0.9, scaleY: 0.9 });
          canvas.car.animate(
            { scaleX: 0.001, scaleY: 0.001, opacity: 0 },
            {
              onChange: canvas.requestRenderAll.bind(canvas),
            }
          );
        } else if (timeNow - obj.tod < 2000) {
          // console.log("too soon");
        } else {
          blocksRemaining.value--;
          if (blocksRemaining.value > 0) {
            obj.death = true;
            // cEvent.instawin();
            obj.tod = Date.now();
            currentSquare = obj;
            obj.animate(
              { opacity: 0, scaleX: 0.8, scaleY: 0.8 },
              { onChange: canvas.renderAll.bind(canvas) },
              1
            );
          }
        }
      }
    });
  }, 300),
};
const cFunction = {
  remove() {
    if (!canvas.objectSelected) return;
    let targets = canvas.objectSelected;
    targets.forEach((target) => {
      canvas.remove(target);
    });
    canvas.objectSelected = null;
    canvas.discardActiveObject();
  },
  reset() {
    position.value = null;
    youWin.value = false;
    canvas.forEachObject((obj) => {
      canvas.remove(obj);
    });
    // canvas.clear();
    gameOver.value = false;
    isGameOver = false;
    canvas.car.currentSpeed = 0;
    canvas.car.lastSpeed = 0;
    currentSquare = null;
    setTimeout(cEvent.setSquares, 100);
    setTimeout(cEvent.setObjects, 150);
    blocksRemaining.value = 99;
  },
  setView() {
    if (startFlag.value) {
      start();
      startFlag.value = false;
    }
    let zoom = 0.02 * (canvas.car.lastSpeed - canvas.car.currentSpeed);
    zoom += canvas.getZoom();
    let newLeft = -canvas.car.left * zoom + conHolder.clientWidth / 2;
    let newTop = -canvas.car.top * zoom + conHolder.clientHeight / 2;
    canvas.setViewportTransform([zoom, 0, 0, zoom, newLeft, newTop]);
    // canvas.requestRenderAll();
    canvas.car.lastSpeed = canvas.car.currentSpeed;
  },
  async setScore() {
    let user = firebase.auth().currentUser;
    if (!user) {
      try {
        let result = await firebase.auth().signInAnonymously();
        console.log(result.user);
        const newScore = await scoreCollection.add({
          uid: result.user.uid,
          name: "anon",
          time: timer.value,
          timeInt: elapsedTime,
          averageFps: averageFps.value,
          timeStamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        scoreId.value = newScore.id;
        position.value = await this.getPosition(newScore.id);
      } catch (error) {
        console.log(error.code, error.message);
      }
    } else {
      try {
        console.log("USER!!", user);
        const newScore = await scoreCollection.add({
          uid: user.uid,
          name: "anon",
          time: timer.value,
          timeInt: elapsedTime,
          averageFps: averageFps.value,
          timeStamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        scoreId.value = newScore.id;
        position.value = await this.getPosition(newScore.id);
      } catch (error) {
        console.log(error.code, error.message);
      }
    }
  },
  changeName(name) {
    scoreCollection.doc(scoreId.value).update({
      name: name,
    });
  },
  async getPosition(scoreId) {
    let count = 1;
    let isFound = false;
    const scoreList = await scoreCollection.orderBy("timeInt").get();
    scoreList.docs.every((score) => {
      console.log(score.id, scoreId, score.data());
      if (score.id === scoreId) {
        isFound = true;
        return false;
      }
      count++;
      return true;
    });
    if (isFound) return count;
    else return null;
  },
  async fetchScores() {
    scoreCollection
      .orderBy("timeInt")
      .limit(10)
      .onSnapshot((snapshot) => {
        let scoreList = [];
        snapshot.forEach((doc) => {
          let thisScore = doc.data();
          thisScore.id = doc.id;
          scoreList.push(thisScore);
        });
        scores.value = scoreList;
      });
  },
};
// Convert time to a format of hours, minutes, seconds, and milliseconds

function timeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  let diffInMs = (diffInSec - ss) * 1000;
  let ms = Math.floor(diffInMs);

  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");
  let formattedMS = ms.toString().padStart(3, "0");

  return `${formattedMM}:${formattedSS}:${formattedMS}`;
}

// function to modify innerHTML

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
  print(timeToString(elapsedTime));
  clearInterval(timerInterval);
}

function reset() {
  clearInterval(timerInterval);
  print("00:00:000");
  elapsedTime = 0;
}
export {
  canvas,
  cEvent,
  cFunction,
  mouseOver,
  blocksRemaining,
  timer,
  gameOver,
  canvasCar,
  startFlag,
  scores,
  scoreId,
  position,
  averageFps,
  youWin,
};
