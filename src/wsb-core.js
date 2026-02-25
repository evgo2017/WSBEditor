export const createMappedFolder = () => ({ host: '', sandbox: '', readonly: false })

export const normalizeFilenameBase = (value) => {
    const cleaned = String(value || '')
        .trim()
        .replace(/\.wsb$/i, '')
        .replace(/[\\/:*?"<>|]/g, '')
    return cleaned || 'Sandbox'
}

export const normalizeMappedFolders = (folders) => {
    const normalized = Array.isArray(folders) ? folders.map((folder) => ({
        host: folder?.host || '',
        sandbox: folder?.sandbox || '',
        readonly: !!folder?.readonly
    })) : []

    return normalized.filter(folder => folder.host || folder.sandbox || folder.readonly)
}

export const parseTristate = (value) => {
    const parsed = Number(value)
    return [0, 1, 2].includes(parsed) ? parsed : 0
}

const mapTristateFromText = (value) => {
    const v = String(value || '').trim().toLowerCase()
    if (v === 'enable' || v === 'true') return 1
    if (v === 'disable' || v === 'false') return 2
    return 0
}

export const escapeXml = (value) => {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

const decodeXml = (value) => {
    return String(value || '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
}

export const normalizeMemoryInMB = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return ''
    if (!/^\d+$/.test(raw)) return null
    const num = Number(raw)
    if (!Number.isInteger(num) || num <= 0) return null
    return String(num)
}

export const getDefaultSandboxPath = (hostPath) => {
    if (!hostPath) return 'Desktop'
    const parts = hostPath.split(/[\\\/]/)
    const last = parts[parts.length - 1] || 'Folder'
    return `C:\\Users\\WDAGUtilityAccount\\Desktop\\${last}`
}

const getFirstTagValue = (xml, tag) => {
    const match = String(xml || '').match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'))
    return match ? decodeXml(match[1].trim()) : ''
}

const getAllTagValues = (xml, tag) => {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'gi')
    const values = []
    let match = regex.exec(String(xml || ''))
    while (match) {
        values.push(decodeXml(match[1].trim()))
        match = regex.exec(String(xml || ''))
    }
    return values
}

export const parseWSB = (xml) => {
    const source = String(xml || '')
    if (!/<Configuration[\s>]/i.test(source)) return null

    const mappedFolders = []
    const mappedFolderRegex = /<MappedFolder>([\s\S]*?)<\/MappedFolder>/gi
    let folderMatch = mappedFolderRegex.exec(source)
    while (folderMatch) {
        const block = folderMatch[1]
        mappedFolders.push({
            host: getFirstTagValue(block, 'HostFolder'),
            sandbox: getFirstTagValue(block, 'SandboxFolder'),
            readonly: getFirstTagValue(block, 'ReadOnly').toLowerCase() === 'true'
        })
        folderMatch = mappedFolderRegex.exec(source)
    }

    return {
        vGPU: mapTristateFromText(getFirstTagValue(source, 'vGPU')),
        Networking: mapTristateFromText(getFirstTagValue(source, 'Networking')),
        AudioInput: mapTristateFromText(getFirstTagValue(source, 'AudioInput')),
        VideoInput: mapTristateFromText(getFirstTagValue(source, 'VideoInput')),
        PrinterRedirection: mapTristateFromText(getFirstTagValue(source, 'PrinterRedirection')),
        ClipboardRedirection: mapTristateFromText(getFirstTagValue(source, 'ClipboardRedirection')),
        ProtectedClient: mapTristateFromText(getFirstTagValue(source, 'ProtectedClient')),
        MemoryInMB: getFirstTagValue(source, 'MemoryInMB'),
        LogonCommand: getAllTagValues(source, 'Command').join('\n'),
        mappedFolders: normalizeMappedFolders(mappedFolders)
    }
}

export const generateWSBXML = (state, metadata = {}) => {
    const normalizedMemoryInMB = normalizeMemoryInMB(state?.MemoryInMB)
    if (normalizedMemoryInMB === null) {
        return { ok: false, error: 'invalid_memory', xml: null }
    }

    const safeState = {
        vGPU: parseTristate(state?.vGPU),
        Networking: parseTristate(state?.Networking),
        AudioInput: parseTristate(state?.AudioInput),
        VideoInput: parseTristate(state?.VideoInput),
        PrinterRedirection: parseTristate(state?.PrinterRedirection),
        ClipboardRedirection: parseTristate(state?.ClipboardRedirection),
        ProtectedClient: parseTristate(state?.ProtectedClient),
        LogonCommand: String(state?.LogonCommand || ''),
        mappedFolders: normalizeMappedFolders(state?.mappedFolders)
    }

    const editorVersion = String(metadata.editorVersion || '0.7.0')
    const downloadTime = String(metadata.downloadTime || Date.now())
    const generator = String(metadata.generator || 'evgo2017.com')
    const generatedAtISO = String(metadata.generatedAtISO || new Date().toISOString())

    let xml = `<Configuration>\n`

    const addTristate = (tag, val) => {
        if (val === 1) xml += `  <${tag}>Enable</${tag}>\n`
        if (val === 2) xml += `  <${tag}>Disable</${tag}>\n`
    }

    addTristate('vGPU', safeState.vGPU)
    addTristate('Networking', safeState.Networking)
    addTristate('AudioInput', safeState.AudioInput)
    addTristate('VideoInput', safeState.VideoInput)
    addTristate('PrinterRedirection', safeState.PrinterRedirection)
    addTristate('ClipboardRedirection', safeState.ClipboardRedirection)
    addTristate('ProtectedClient', safeState.ProtectedClient)

    if (normalizedMemoryInMB) {
        xml += `  <MemoryInMB>${escapeXml(normalizedMemoryInMB)}</MemoryInMB>\n`
    }

    if (safeState.LogonCommand.trim()) {
        xml += `  <LogonCommand>\n`
        safeState.LogonCommand
            .split('\n')
            .filter(line => line.trim())
            .forEach((cmd) => {
                xml += `    <Command>${escapeXml(cmd.trim())}</Command>\n`
            })
        xml += `  </LogonCommand>\n`
    }

    const folders = safeState.mappedFolders.filter(folder => (folder.host || '').trim())
    if (folders.length > 0) {
        xml += `  <MappedFolders>\n`
        folders.forEach((folder) => {
            const host = (folder.host || '').trim()
            const sandbox = (folder.sandbox || '').trim() || getDefaultSandboxPath(host)
            xml += `    <MappedFolder>\n`
            xml += `      <HostFolder>${escapeXml(host)}</HostFolder>\n`
            xml += `      <SandboxFolder>${escapeXml(sandbox)}</SandboxFolder>\n`
            xml += `      <ReadOnly>${folder.readonly}</ReadOnly>\n`
            xml += `    </MappedFolder>\n`
        })
        xml += `  </MappedFolders>\n`
    }

    xml += `  <WSBEditorConfig>\n`
    xml += `    <EditorVersion>${escapeXml(editorVersion)}</EditorVersion>\n`
    xml += `    <DownloadTime>${escapeXml(downloadTime)}</DownloadTime>\n`
    xml += `    <Generator>${escapeXml(generator)}</Generator>\n`
    xml += `    <GeneratedAtISO>${escapeXml(generatedAtISO)}</GeneratedAtISO>\n`
    xml += `  </WSBEditorConfig>\n`
    xml += `</Configuration>`

    return { ok: true, error: null, xml }
}
