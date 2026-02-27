import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from './i18n'

const app = createApp(App)

// Baidu Analytics
const baiduId = import.meta.env.VITE_BAIDU_TONGJI_ID
if (baiduId && !import.meta.env.DEV) {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const normalizedBase = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '')
    const pathname = window.location.pathname || '/'
    const trackedPath = pathname.startsWith(normalizedBase)
        ? pathname
        : `${normalizedBase}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
    const trackedUrl = `${trackedPath}${window.location.search}${window.location.hash}`

    window._hmt = window._hmt || [];
    window._hmt.push(['_setAutoPageview', false])
    window._hmt.push(['_trackPageview', trackedUrl])

    (function () {
        const hm = document.createElement("script")
        hm.src = `https://hm.baidu.com/hm.js?${baiduId}`
        const s = document.getElementsByTagName("script")[0]
        s.parentNode.insertBefore(hm, s)
    })()
}

app.use(i18n)
app.mount('#app')
