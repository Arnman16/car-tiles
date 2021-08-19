<template>
  <!-- <NavB /> -->
  <!-- <GameOver /> -->
  <Canvas />
</template>

<script>
import Canvas from './components/Canvas.vue';
// import Canvas from "./components/Canvas.vue";
// import GameOver from "./components/GameOver.vue";

export default {
  name: "App",
  components: {
    Canvas
    // GameOver,
  },
};
</script>

<style>
html {
  background-color: black;
}

body {
  margin: 0px;
}
/* #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
} */
</style>
