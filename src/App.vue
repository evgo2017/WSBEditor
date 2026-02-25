<script setup>
import { ref, reactive, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TristateBox from './components/TristateBox.vue'
import packageJson from '../package.json'

// 直接导入配置
import configsData from './configs/configs.json'
import {
    createMappedFolder,
    normalizeFilenameBase,
    normalizeMappedFolders,
    parseTristate,
    getDefaultSandboxPath,
    parseWSB,
    generateWSBXML as buildWSBXMLFromState
} from './wsb-core'

const { t, locale } = useI18n()

// 自动导入所有 WSB 文件内容
const wsbModules = import.meta.glob('./configs/*.wsb', { query: '?raw', import: 'default', eager: true })

// 辅助函数：根据路径匹配 WSB 内容
const getWsbContentByPath = (filePath) => {
    if (!filePath) return null
    // 处理路径格式以匹配 glob 键名
    const key = `./${filePath.replace(/\\/g, '/')}`
    return wsbModules[key] || null
}

const editorVersion = packageJson.version || '0.0.0'
const stateCacheKey = 'WSBEditor_StateCache'

const sortQuickConfigs = (configs = []) => {
    return configs
        .filter(config => config.id !== 'last_session')
        .sort((a, b) => {
            if (a.id === 'windows_default') return -1
            if (b.id === 'windows_default') return 1
            return 0
        })
}

const configCategoryLabels = {
    en: {
        baseline: 'Baseline',
        files: 'File Workflows',
        security: 'Security'
    },
    zh: {
        baseline: '基础配置',
        files: '文件场景',
        security: '安全场景',
    }
}

const getConfigDisplayName = (config) => {
    if (!config?.name) return 'Sandbox'
    return config.name[locale.value] || config.name.en || config.name.zh || 'Sandbox'
}

const activeConfigId = ref(null)
const quickConfigs = ref(sortQuickConfigs(configsData.configs || []))
const groupedQuickConfigs = computed(() => {
    const groups = new Map()
    quickConfigs.value.forEach((config) => {
        const category = config.category || 'baseline'
        if (!groups.has(category)) groups.set(category, [])
        groups.get(category).push(config)
    })

    return Array.from(groups.entries()).map(([key, configs]) => ({
        key,
        label: configCategoryLabels[locale.value]?.[key] || key,
        configs
    }))
})
const alerts = ref([])
const fileInput = ref(null)

const state = reactive({
    filename: 'Sandbox',
    vGPU: 0,
    Networking: 0,
    AudioInput: 0,
    VideoInput: 0,
    PrinterRedirection: 0,
    ClipboardRedirection: 0,
    ProtectedClient: 0,
    MemoryInMB: '',
    LogonCommand: '',
    mappedFolders: []
})

const setLanguage = (l) => {
    locale.value = l
    localStorage.setItem('WSBEditor_Language', l)
}

const addAlert = (msg, type = 'blue') => {
    const id = Date.now()
    alerts.value.push({ id, msg, type })
    setTimeout(() => {
        alerts.value = alerts.value.filter(a => a.id !== id)
    }, 5000)
}

const saveStateCache = () => {
    try {
        const cachedState = {
            filename: normalizeFilenameBase(state.filename),
            vGPU: state.vGPU,
            Networking: state.Networking,
            AudioInput: state.AudioInput,
            VideoInput: state.VideoInput,
            PrinterRedirection: state.PrinterRedirection,
            ClipboardRedirection: state.ClipboardRedirection,
            ProtectedClient: state.ProtectedClient,
            MemoryInMB: state.MemoryInMB,
            LogonCommand: state.LogonCommand,
            mappedFolders: state.mappedFolders.map(folder => ({
                host: folder.host || '',
                sandbox: folder.sandbox || '',
                readonly: !!folder.readonly
            }))
        }
        localStorage.setItem(stateCacheKey, JSON.stringify(cachedState))
    } catch {
        // ignore cache write errors
    }
}

const restoreStateCache = () => {
    try {
        const cachedRaw = localStorage.getItem(stateCacheKey)
        if (!cachedRaw) return
        const cachedState = JSON.parse(cachedRaw)

        state.filename = normalizeFilenameBase(cachedState.filename)
        state.vGPU = parseTristate(cachedState.vGPU)
        state.Networking = parseTristate(cachedState.Networking)
        state.AudioInput = parseTristate(cachedState.AudioInput)
        state.VideoInput = parseTristate(cachedState.VideoInput)
        state.PrinterRedirection = parseTristate(cachedState.PrinterRedirection)
        state.ClipboardRedirection = parseTristate(cachedState.ClipboardRedirection)
        state.ProtectedClient = parseTristate(cachedState.ProtectedClient)
        state.MemoryInMB = cachedState.MemoryInMB === undefined || cachedState.MemoryInMB === null
            ? ''
            : String(cachedState.MemoryInMB)
        state.LogonCommand = cachedState.LogonCommand || ''
        state.mappedFolders = normalizeMappedFolders(cachedState.mappedFolders)
    } catch {
        // ignore cache parse errors
    }
}

const addMappedFolder = () => {
    state.mappedFolders.push(createMappedFolder())
}

const removeMappedFolder = (index) => {
    state.mappedFolders.splice(index, 1)
}

const getSandboxPlaceholder = (hostPath) => {
    const trimmed = (hostPath || '').trim()
    return trimmed ? getDefaultSandboxPath(trimmed) : t('placeholderSandboxFolderAuto')
}

const loadQuickConfig = (config) => {
    activeConfigId.value = config.id
    const content = getWsbContentByPath(config.file)
    if (content) loadWSB(content)
    else addAlert('Internal Config Not Found: ' + config.file, 'red')
    state.filename = normalizeFilenameBase(getConfigDisplayName(config))
}

const loadWSB = (xml) => {
    const parsed = parseWSB(xml)
    if (!parsed) {
        addAlert(t('invalidWSB'), 'red')
        return
    }

    state.vGPU = parsed.vGPU
    state.Networking = parsed.Networking
    state.AudioInput = parsed.AudioInput
    state.VideoInput = parsed.VideoInput
    state.PrinterRedirection = parsed.PrinterRedirection
    state.ClipboardRedirection = parsed.ClipboardRedirection
    state.ProtectedClient = parsed.ProtectedClient
    state.MemoryInMB = parsed.MemoryInMB
    state.LogonCommand = parsed.LogonCommand
    state.mappedFolders = parsed.mappedFolders
    addAlert(t('configLoaded'), 'green')
}

const generateWSBXML = () => {
    const result = buildWSBXMLFromState(state, {
        editorVersion,
        downloadTime: Date.now(),
        generator: 'evgo2017.com',
        generatedAtISO: new Date().toISOString()
    })

    if (!result.ok) {
        addAlert(t('memoryInvalid'), 'red')
        return null
    }

    return result.xml
}

const download = () => {
    const xml = generateWSBXML()
    if (!xml) return

    const blob = new Blob([xml], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const filename = normalizeFilenameBase(state.filename)
    state.filename = filename
    a.href = url
    a.download = `${filename}.wsb`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addAlert(t('downloading') || 'Downloading WSB...', 'green')
}

const showOpenFileDialog = () => { fileInput.value.click(); }

const onFileSelected = (e) => {
    const file = e.target.files[0]
    if (!file) return
    activeConfigId.value = null
    state.filename = normalizeFilenameBase(file.name)
    const reader = new FileReader()
    reader.onload = (event) => { loadWSB(event.target.result) }
    reader.readAsText(file)
    e.target.value = ''
}

onMounted(() => {
    restoreStateCache()
})

let cacheSaveTimer = null
watch(state, () => {
    if (cacheSaveTimer) clearTimeout(cacheSaveTimer)
    cacheSaveTimer = setTimeout(() => {
        saveStateCache()
        cacheSaveTimer = null
    }, 200)
}, { deep: true })

onBeforeUnmount(() => {
    if (cacheSaveTimer) {
        clearTimeout(cacheSaveTimer)
        saveStateCache()
    }
})
</script>

<template>
  <aside class="sidebar">
      <div class="sidebar-header">
          <h3>{{ t('quickConfigs') }}</h3>
          <p>{{ t('quickConfigsDesc') }}</p>
      </div>
      <div class="config-list">
          <div v-for="group in groupedQuickConfigs" :key="group.key" class="config-group">
              <div class="config-group-title">{{ group.label }}</div>
              <div v-for="config in group.configs" :key="config.id" class="config-item"
                  :data-testid="`quick-config-${config.id}`"
                  :class="{ active: activeConfigId === config.id }" @click="loadQuickConfig(config)">
                  <div class="config-icon">{{ config.icon }}</div>
                  <div class="config-info">
                      <div v-if="config.name" class="config-name">{{ config.name[locale] }}</div>
                      <div v-if="config.description" class="config-desc">{{ config.description[locale] }}</div>
                  </div>
              </div>
          </div>
      </div>
      <div class="sidebar-actions">
          <button class="btn btn-secondary" data-testid="open-file" @click="showOpenFileDialog">📁 {{ t('open') }}</button>
      </div>
  </aside>

  <main class="main-content">
      <div class="card">
          <div class="header">
              <div class="title-group">
                  <div class="title-main">
                      <h1>{{ t('appTitle') }}</h1>
                      <span class="version-tag">v{{ editorVersion }}</span>
                  </div>
                  <div class="app-description">
                      <strong>{{ t('appFullName') }}</strong> {{ t('appSubtitle') }}
                  </div>
                  <div class="link-group">
                      <div class="link-item-group">
                          <span>{{ t('footerCurrent') }}（</span>
                          <a href="https://evgo2017.com/project/WSBEditor">🌐 {{ t('footerLinkOnline') }}</a>
                          <span class="sub-divider">|</span>
                          <a href="https://github.com/evgo2017/WSBEditor" target="_blank" rel="noopener noreferrer">
                              <svg height="14" width="14" viewBox="0 0 16 16"
                                  style="vertical-align: text-bottom; fill: currentColor; margin-right: 2px;">
                                  <path
                                      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z">
                                  </path>
                              </svg>
                              evgo2017/WSBEditor
                          </a>
                          <span>）</span>
                      </div>
                      <span class="divider">|</span>
                      <div class="link-item-group">
                          <span>{{ t('footerOriginal') }}（</span>
                          <a href="https://leestevetk.github.io/WSBEditor/WSBEditor-Latest.html" target="_blank"
                              rel="noopener noreferrer">🌐 {{ t('footerLinkOnline') }}</a>
                          <span class="sub-divider">|</span>
                          <a href="https://github.com/leestevetk/WSBEditor" target="_blank" rel="noopener noreferrer">
                              <svg height="14" width="14" viewBox="0 0 16 16"
                                  style="vertical-align: text-bottom; fill: currentColor; margin-right: 2px;">
                                  <path
                                      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z">
                                  </path>
                              </svg>
                              leestevetk/WSBEditor
                          </a>
                          <span>）</span>
                      </div>
                  </div>
              </div>
              <div class="lang-switch">
                  <button class="btn-toggle" data-testid="lang-zh" :class="{ active: locale === 'zh' }"
                      @click="setLanguage('zh')">中文</button>
                  <button class="btn-toggle" data-testid="lang-en" :class="{ active: locale === 'en' }"
                      @click="setLanguage('en')">English</button>
              </div>
          </div>

          <!-- Basic Info -->
          <div class="section">
              <div class="section-title">📂 {{ t('filename') }}</div>
              <div class="form-grid">
                  <div class="form-group">
                      <div class="input-with-suffix">
                          <input type="text" data-testid="filename-input" v-model="state.filename" placeholder="Sandbox">
                          <span class="input-suffix">.wsb</span>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Graphics & Network -->
          <div class="section">
              <div class="section-title">⚡ {{ t('graphics') }} & {{ t('network') }}</div>
              <div class="form-grid">
                  <TristateBox v-model="state.vGPU" :label="t('enableVGpu')"
                      :desc="t('enableVGpuDesc')" />
                  <TristateBox v-model="state.Networking" :label="t('network')"
                      :desc="t('connectNetworkDesc')" />
              </div>
          </div>

          <!-- Resources -->
          <div class="section">
              <div class="section-title">🎙️ {{ t('sharedResources') }}</div>
              <div class="form-grid">
                  <TristateBox v-model="state.AudioInput" :label="t('microphones')" />
                  <TristateBox v-model="state.VideoInput" :label="t('cameras')" />
                  <TristateBox v-model="state.PrinterRedirection" :label="t('printers')" />
                  <TristateBox v-model="state.ClipboardRedirection" :label="t('clipboard')" />
              </div>
          </div>

          <!-- Memory -->
          <div class="section">
              <div class="section-title">🧠 {{ t('memory') }}</div>
              <div class="form-group" style="max-width: 300px;">
                  <div class="input-with-suffix">
                      <input type="number" data-testid="memory-input" min="1" step="1" v-model="state.MemoryInMB"
                          :placeholder="t('placeholderAuto')">
                      <span class="input-suffix">MB</span>
                  </div>
                  <span class="h6span">{{ t('memoryDesc') }}</span>
              </div>
          </div>

          <!-- Mapped Folders -->
          <div class="section">
              <div class="section-title">📂 {{ t('mappedUserFolders') }}</div>
              <div class="h6span" style="margin-bottom: 10px;">{{ t('mappedFoldersDesc') }}</div>

              <div class="table-container">
                  <table>
                      <thead>
                          <tr>
                              <th>{{ t('hostFolder') }}</th>
                              <th>{{ t('sandboxFolder') }}</th>
                              <th width="150">{{ t('readWrite') }}</th>
                              <th width="120">{{ t('actions') }}</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="(folder, index) in state.mappedFolders" :key="index" :data-testid="`mapped-folder-row-${index}`">
                              <td><input type="text" :data-testid="`mapped-host-${index}`" v-model="folder.host" :placeholder="t('placeholderHostFolder')"></td>
                              <td><input type="text" :data-testid="`mapped-sandbox-${index}`" v-model="folder.sandbox"
                                      :placeholder="getSandboxPlaceholder(folder.host)"></td>
                              <td>
                                  <select :data-testid="`mapped-readonly-${index}`" v-model="folder.readonly">
                                      <option :value="false">{{ t('readWrite') }}</option>
                                      <option :value="true">{{ t('readOnly') }}</option>
                                  </select>
                              </td>
                              <td>
                                  <button type="button" class="row-action-btn row-action-delete" :data-testid="`mapped-remove-${index}`"
                                      @click="removeMappedFolder(index)">
                                      {{ t('delete') }}
                                  </button>
                              </td>
                          </tr>
                          <tr>
                              <td colspan="4">
                                  <button type="button" class="row-action-btn row-action-add" data-testid="mapped-add" @click="addMappedFolder">
                                      + {{ t('addMappedFolder') }}
                                  </button>
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>

          <!-- Logon Command -->
          <div class="section">
              <div class="section-title">📜 {{ t('logonCommands') }}</div>
              <div class="form-group">
                  <textarea data-testid="logon-command" v-model="state.LogonCommand" rows="4"
                      :placeholder="t('placeholderLogonCommand')"></textarea>
                  <span class="h6span">{{ t('logonCommandsDesc') }}</span>
              </div>
          </div>

          <!-- Security -->
          <div class="section">
              <div class="section-title">🛡️ {{ t('security') }}</div>
              <div class="form-grid">
                  <TristateBox v-model="state.ProtectedClient" :label="t('protectedClient')"
                      :desc="t('protectedClientDesc')" />
              </div>
          </div>
      </div>
  </main>

  <!-- Footer Actions -->
  <div class="footer-actions">
      <button class="btn btn-primary" data-testid="download-wsb" @click="download">💾 {{ t('download') }}</button>
  </div>

  <input type="file" data-testid="file-input" ref="fileInput" style="display: none" @change="onFileSelected" accept=".wsb">

  <div class="alert-container">
      <div v-for="alert in alerts" :key="alert.id" class="alert" :class="alert.type">
          <span>{{ alert.msg }}</span>
      </div>
  </div>
</template>
