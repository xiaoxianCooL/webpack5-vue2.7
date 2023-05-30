import Vue from 'vue';
import router from './router';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import ElImageViewer from 'element-ui/packages/image/src/image-viewer';
Vue.component('ElImageViewer', ElImageViewer);
import App from './App.vue';
Vue.use(ElementUI);
new Vue({
    router,
    render: h => h(App)
}).$mount("#app")