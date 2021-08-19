<template>
  <div class="flex items-center justify-center h-screen w-screen">
    <div
      class="
        bg-indigo-800
        text-white
        rounded-lg
        shadow-inner
        p-10
        opacity-80
        font-mono
      "
    >
      <div v-if="youWin && !position">
        <div
          class="
            loader
            bg-white
            p-5
            rounded-full
            flex
            space-x-3
            opacity-75
            mx-auto
          "
        >
          <div class="w-5 h-5 bg-gray-800 rounded-full animate-bounce"></div>
          <div class="w-5 h-5 bg-gray-800 rounded-full animate-bounce"></div>
          <div class="w-5 h-5 bg-gray-800 rounded-full animate-bounce"></div>
        </div>
      </div>
      <div v-else-if="youWin" class="container">
        <div
          class="
            border-solid border-4 border-light-blue-500
            m-2
            p-4
            rounded-lg
            flex-wrap
            max-w-md
          "
        >
          <div class="text-center">{{ message.title }}</div>
          <div class="mx-2 text-center">
            {{ message.body }}
            <br />
            <button
              class="
                bg-transparent
                hover:bg-indigo-500
                font-semibold
                py-1
                px-3
                border-2
                rounded
                mt-2
              "
              @click="reset"
            >
              Play Again
            </button>
          </div>
        </div>
        <div
          class="border-solid border-4 border-light-blue-500 m-2 p-3 rounded-lg"
        >
          <div class="text-center font-bold underline">High Scores</div>
          <div class="flex items-center">
            <div class="flex-grow"></div>
            <div class="mx-5 w-4 text-center text-yellow-400">#</div>
            <div class="mx-5 w-20 text-center text-yellow-400">time</div>
            <div class="mx-5 w-20 text-center text-yellow-400">name</div>
            <div class="flex-grow"></div>
          </div>
          <div
            class="flex items-center"
            :class="score.id === scoreId ? 'bg-purple-900' : ''"
            v-for="(score, index) in scores"
            :key="score.id"
          >
            <div class="flex-grow"></div>
            <div class="mx-5 w-4 text-center">
              {{ String(index + 1).padStart(2, "0") }}
            </div>
            <div class="mx-5 w-20 text-center">{{ score.time }}</div>
            <div class="mx-5 w-20 text-center">{{ score.name }}</div>
            <div class="flex-grow"></div>
          </div>
        </div>
        <div
          class="border-solid border-4 border-light-blue-500 m-2 p-3 rounded-lg"
        >
          <div class="text-center m-2">
            Your time: {{ timer }}<br />
            Your position: {{ position }}
          </div>
        </div>
      </div>
      <div v-else class="container">
        <div
          class="
            border-solid border-4 border-light-blue-500
            m-2
            p-4
            rounded-lg
            flex-wrap
            max-w-md
          "
        >
          <div class="text-center">YOU LOSE!!</div>
          <button
            class="
              bg-transparent
              hover:bg-indigo-500
              font-semibold
              py-1
              px-3
              border-2
              rounded
              mt-2
            "
            @click="reset"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { onMounted, ref, watch } from "vue";
import {
  cFunction,
  scores,
  position,
  scoreId,
  gameOver,
  blocksRemaining,
  timer,
  youWin,
} from "./js/canvasEvents";
// const isEmpty = require("lodash/isEmpty");
export default {
  setup() {
    const message = ref({
      title: "Sorry.",
      body: "You didn't make it to the high score list.",
    });
    watch(gameOver, (isOver) => {
      if (isOver && blocksRemaining.value === 0) {
        cFunction.setScore();
      }
    });
    watch(position, (newPosition) => {
      if (newPosition === 1) {
        message.value.title = "HOLY CRAP!";
        message.value.body = "You are number 1!!!";
      } else if (newPosition <= 10) {
        message.value.title = "WOW!";
        message.value.body = "You made the top 10!";
      } else {
        message.value.title = "Sorry.";
        message.value.body = "You didn't make it to the high score list.";
      }
    });
    onMounted(() => {
      cFunction.fetchScores();
    });
    return {
      scores,
      message,
      position,
      scoreId,
      reset: cFunction.reset,
      timer,
      gameOver,
      youWin,
    };
  },
};
</script>
<style>
html {
  color: white;
  background-color: white;
}
.loader div {
  animation-duration: 0.5s;
}

.loader div:first-child {
  animation-delay: 0.1s;
}

.loader div:nth-child(2) {
  animation-delay: 0.3s;
}

.loader div:nth-child(3) {
  animation-delay: 0.6s;
}
</style>