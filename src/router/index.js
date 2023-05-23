import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
const pages1 = () => import('@/pages/pages1.vue');
const pages2 = () => import('@/pages/pages2.vue');

const router = new VueRouter({
    routes: [
        { path: '/fssc/pages1', name: '页面1', component: pages1 },
        { path: '/fssc/pages2', name: '页面2', component: pages2 },
    ],
    beseurl:'/vue-dist/',
    mode:'history'
})
export default router;