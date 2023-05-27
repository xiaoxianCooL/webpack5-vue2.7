import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
const pagesA = () => import('@/pages/pagesA');
const pagesB = () => import('@/pages/pagesB');

const router = new VueRouter({
    routes: [
        { path: '/fssc/pagesA', name: 'pagesA', component: pagesA },
        { path: '/fssc/pagesB', name: 'pagesB', component: pagesB },
    ],
    base:'/vue-dist/',
    mode:'history'
})
export default router;