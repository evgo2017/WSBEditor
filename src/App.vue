<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import TristateBox from './components/TristateBox.vue'

// 直接导入配置
import configsData from './configs/configs.json'

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

const editorVersion = "0.7.0"
const activeConfigId = ref(null)
const quickConfigs = ref(configsData.configs || [])
const alerts = ref([])
const fileInput = ref(null)

const state = reactive({
    filename: 'Sandbox.wsb',
    vGPU: 0,
    Networking: 0,
    AudioInput: 0,
    VideoInput: 0,
    PrinterRedirection: 0,
    ClipboardRedirection: 0,
    ProtectedClient: 0,
    MemoryInMB: '',
    HomeDirectory: '',
    LogonCommand: '',
    mappedFolders: [
        { enabled: false, host: '', sandbox: '', readonly: false }
    ]
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

const onFolderInput = (index) => {
    if (index === state.mappedFolders.length - 1 && state.mappedFolders[index].host) {
        state.mappedFolders.push({ enabled: true, host: '', sandbox: '', readonly: false })
    }
    if (state.mappedFolders[index].host) {
        state.mappedFolders[index].enabled = true
    }
}

const getDefaultSandboxPath = (hostPath) => {
    if (!hostPath) return 'Desktop'
    const parts = hostPath.split(/[\\\/]/)
    const last = parts[parts.length - 1] || 'Folder'
    return `C:\\Users\\WDAGUtilityAccount\\Desktop\\${last}`
}

const loadQuickConfig = (config) => {
    activeConfigId.value = config.id
    if (config.type === 'template') {
        applyTemplate(config.templateId);
    } else if (config.type === 'file') {
        const content = getWsbContentByPath(config.file);
        if (content) loadWSB(content);
        else addAlert('Internal Config Not Found: ' + config.file, 'red');
    }
}

const applyTemplate = (id) => {
    state.vGPU = id === 0 ? 0 : 1
    state.Networking = id === 1 ? 2 : 1
    addAlert(t('templateApplied'), 'green')
}

const loadWSB = (xml) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, "text/xml")
    const cfg = doc.getElementsByTagName("Configuration")[0]
    if (!cfg) return

    const getVal = (tag) => cfg.getElementsByTagName(tag)[0]?.textContent?.trim() || ''

    const mapTristate = (val) => {
        const v = val.toLowerCase()
        if (v === 'enable' || v === 'true') return 1
        if (v === 'disable' || v === 'false') return 2
        return 0
    }

    state.vGPU = mapTristate(getVal("vGPU"))
    state.Networking = mapTristate(getVal("Networking"))
    state.AudioInput = mapTristate(getVal("AudioInput"))
    state.VideoInput = mapTristate(getVal("VideoInput"))
    state.PrinterRedirection = mapTristate(getVal("PrinterRedirection"))
    state.ClipboardRedirection = mapTristate(getVal("ClipboardRedirection"))
    state.ProtectedClient = mapTristate(getVal("ProtectedClient"))
    state.MemoryInMB = getVal("MemoryInMB")

    const commands = []
    const cmdEls = cfg.getElementsByTagName("Command")
    for (let i = 0; i < cmdEls.length; i++) commands.push(cmdEls[i].textContent)
    state.LogonCommand = commands.join('\n')

    const mfEls = cfg.getElementsByTagName("MappedFolder")
    state.mappedFolders = []
    for (let i = 0; i < mfEls.length; i++) {
        state.mappedFolders.push({
            enabled: true,
            host: mfEls[i].getElementsByTagName("HostFolder")[0]?.textContent || '',
            sandbox: mfEls[i].getElementsByTagName("SandboxFolder")[0]?.textContent || '',
            readonly: mfEls[i].getElementsByTagName("ReadOnly")[0]?.textContent.toLowerCase() === 'true'
        })
    }
    state.mappedFolders.push({ enabled: false, host: '', sandbox: '', readonly: false })
    addAlert(t('configLoaded'), 'green')
}

const generateWSBXML = () => {
    let xml = `<Configuration>\n`
    const addTristate = (tag, val) => {
        if (val === 1) xml += `  <${tag}>Enable</${tag}>\n`
        if (val === 2) xml += `  <${tag}>Disable</${tag}>\n`
    }
    addTristate("vGPU", state.vGPU)
    addTristate("Networking", state.Networking)
    addTristate("AudioInput", state.AudioInput)
    addTristate("VideoInput", state.VideoInput)
    addTristate("PrinterRedirection", state.PrinterRedirection)
    addTristate("ClipboardRedirection", state.ClipboardRedirection)
    addTristate("ProtectedClient", state.ProtectedClient)
    if (state.MemoryInMB) xml += `  <MemoryInMB>${state.MemoryInMB}</MemoryInMB>\n`
    if (state.LogonCommand.trim()) {
        xml += `  <LogonCommand>\n`
        state.LogonCommand.split('\n').filter(l => l.trim()).forEach(cmd => {
            xml += `    <Command>${cmd.trim()}</Command>\n`
        })
        xml += `  </LogonCommand>\n`
    }
    const folders = state.mappedFolders.filter(f => f.enabled && f.host)
    if (folders.length > 0) {
        xml += `  <MappedFolders>\n`
        folders.forEach(f => {
            xml += `    <MappedFolder>\n`
            xml += `      <HostFolder>${f.host}</HostFolder>\n`
            xml += `      <SandboxFolder>${f.sandbox || getDefaultSandboxPath(f.host)}</SandboxFolder>\n`
            xml += `      <ReadOnly>${f.readonly}</ReadOnly>\n`
            xml += `    </MappedFolder>\n`
        })
        xml += `  </MappedFolders>\n`
    }
    xml += `  <WSBEditorConfig>\n`
    xml += `    <EditorVersion>${editorVersion}</EditorVersion>\n`
    xml += `    <EditorRelease>20260204</EditorRelease>\n`
    xml += `    <DownloadTime>${Date.now()}</DownloadTime>\n`
    xml += `    <HomeDirectory>${state.HomeDirectory}</HomeDirectory>\n`
    xml += `    <Language>${locale.value}</Language>\n`
    xml += `  </WSBEditorConfig>\n`
    xml += `</Configuration>`
    return xml
}

const download = () => {
    const blob = new Blob([generateWSBXML()], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = state.filename.endsWith('.wsb') ? state.filename : state.filename + '.wsb'
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
    state.filename = file.name
    const reader = new FileReader()
    reader.onload = (event) => { loadWSB(event.target.result) }
    reader.readAsText(file)
}
</script>

<template>
  <aside class="sidebar">
      <div class="sidebar-header">
          <h3>{{ t('quickConfigs') }}</h3>
          <p>{{ t('quickConfigsDesc') }}</p>
      </div>
      <div class="config-list">
          <div v-for="config in quickConfigs" :key="config.id" class="config-item"
              :class="{ active: activeConfigId === config.id }" @click="loadQuickConfig(config)">
              <div class="config-icon">{{ config.icon }}</div>
              <div class="config-info">
                  <div v-if="config.name" class="config-name">{{ config.name[locale] }}</div>
                  <div v-if="config.description" class="config-desc">{{ config.description[locale] }}</div>
              </div>
          </div>
      </div>
  </aside>

  <main class="main-content">
      <div class="card">
          <div class="header">
              <h1>WSBEditor v{{ editorVersion }}</h1>
              <div class="lang-switch">
                  <button class="btn-toggle" :class="{ active: locale === 'en' }"
                      @click="setLanguage('en')">English</button>
                  <button class="btn-toggle" :class="{ active: locale === 'zh' }"
                      @click="setLanguage('zh')">中文</button>
              </div>
          </div>

          <!-- Basic Info -->
          <div class="section">
              <div class="section-title">📂 {{ t('filename') }}</div>
              <div class="form-grid">
                  <div class="form-group">
                      <input type="text" v-model="state.filename" placeholder="Sandbox.wsb">
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
                  <input type="number" v-model="state.MemoryInMB" :placeholder="t('placeholderAuto')">
                  <span class="h6span">{{ t('memoryDesc') }}</span>
              </div>
          </div>

          <!-- Mapped Folders -->
          <div class="section">
              <div class="section-title">📂 {{ t('mappedUserFolders') }}</div>
              <div class="form-group" style="margin-bottom: 20px;">
                  <input type="text" v-model="state.HomeDirectory" :placeholder="t('placeholderHomeDir')">
                  <span class="h6span" v-html="t('homeDirectoryDesc')"></span>
              </div>

              <div class="table-container">
                  <table>
                      <thead>
                          <tr>
                              <th width="40"></th>
                              <th>{{ t('hostFolder') }}</th>
                              <th>{{ t('sandboxFolder') }}</th>
                              <th width="120">{{ t('readWrite') }}</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="(folder, index) in state.mappedFolders" :key="index">
                              <td><input type="checkbox" v-model="folder.enabled" style="display: initial;"></td>
                              <td><input type="text" v-model="folder.host" @input="onFolderInput(index)"></td>
                              <td><input type="text" v-model="folder.sandbox"
                                      :placeholder="getDefaultSandboxPath(folder.host)"></td>
                              <td>
                                  <select v-model="folder.readonly">
                                      <option :value="false">{{ t('readWrite') }}</option>
                                      <option :value="true">{{ t('readOnly') }}</option>
                                  </select>
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
                  <textarea v-model="state.LogonCommand" rows="4"
                      :placeholder="t('logonCommandsDesc')"></textarea>
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
      <button class="btn btn-secondary" @click="showOpenFileDialog">📁 {{ t('open') }}</button>
      <button class="btn btn-primary" @click="download">💾 {{ t('download') }}</button>
  </div>

  <input type="file" ref="fileInput" style="display: none" @change="onFileSelected" accept=".wsb">

  <div class="alert-container">
      <div v-for="alert in alerts" :key="alert.id" class="alert" :class="alert.type">
          <span>{{ alert.msg }}</span>
      </div>
  </div>
</template>
