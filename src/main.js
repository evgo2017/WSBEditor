import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from './i18n'

const app = createApp(App)

// Baidu Analytics
const baiduId = import.meta.env.VITE_BAIDU_TONGJI_ID
if (baiduId) {
    window._hmt = window._hmt || [];
    (function () {
        const hm = document.createElement("script")
        hm.src = `https://hm.baidu.com/hm.js?${baiduId}`
        const s = document.getElementsByTagName("script")[0]
        s.parentNode.insertBefore(hm, s)
    })()
}

app.use(i18n)
app.mount('#app')
