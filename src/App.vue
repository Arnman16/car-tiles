<template>
  <!-- <NavB /> -->
  <Canvas />
</template>

<script>
import Canvas from "./components/Canvas.vue";
// import NavB from "./components/NavB.vue";

export default {
  name: "App",
  components: {
    Canvas,
    // NavB,
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
