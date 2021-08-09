import { createApp } from 'vue';
import App from './App.vue';
import './index.css';
import Vue3TouchEvents from "vue3-touch-events";


createApp(App).use(Vue3TouchEvents, { disableClick: true, }).mount('#app');
