import { createI18n } from 'vue-i18n'
import languages from './configs/languages.json'

// 检查浏览器语言，获取首选语言（如 'zh-CN' -> 'zh'）
const getBrowserLang = () => {
    const lang = navigator.language || navigator.userLanguage
    if (lang.startsWith('zh')) return 'zh'
    return 'en'
}

const i18n = createI18n({
    legacy: false, // 使用 Composition API 模式
    locale: localStorage.getItem('WSBEditor_Language') || getBrowserLang(),
    fallbackLocale: 'en',
    messages: languages
})

export default i18n
