import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { generateWSBXML, parseWSB } from '../src/wsb-core.js'

const rootDir = process.cwd()
const configsDir = path.join(rootDir, 'src', 'configs')
const configsJsonPath = path.join(configsDir, 'configs.json')

const configs = JSON.parse(readFileSync(configsJsonPath, 'utf8')).configs
const wsbConfigs = configs.filter((config) => typeof config.file === 'string' && config.file.endsWith('.wsb'))

test('all quick configs are file-backed and have no template fields', () => {
    for (const config of configs) {
        assert.equal(typeof config.file, 'string', `config "${config.id}" must define a .wsb file`)
        assert.equal(Object.prototype.hasOwnProperty.call(config, 'type'), false, `config "${config.id}" should not use "type"`)
        assert.equal(Object.prototype.hasOwnProperty.call(config, 'templateId'), false, `config "${config.id}" should not use "templateId"`)
    }
})

test('all file configs reference existing wsb files', () => {
    for (const config of wsbConfigs) {
        const absolutePath = path.join(rootDir, 'src', config.file)
        assert.equal(existsSync(absolutePath), true, `missing file for config "${config.id}": ${config.file}`)
    }
})

test('no orphan wsb files remain in src/configs', () => {
    const referencedWsbFiles = new Set(wsbConfigs.map((config) => path.basename(config.file)))
    const actualWsbFiles = readdirSync(configsDir).filter((name) => name.endsWith('.wsb'))

    assert.deepEqual(
        [...actualWsbFiles].sort(),
        [...referencedWsbFiles].sort(),
        'found unreferenced or missing .wsb files in src/configs'
    )
})

test('referenced wsb metadata contains required fields', () => {
    for (const config of wsbConfigs) {
        const absolutePath = path.join(rootDir, 'src', config.file)
        const wsb = readFileSync(absolutePath, 'utf8')

        assert.match(wsb, /<WSBEditorConfig>[\s\S]*<\/WSBEditorConfig>/, `${config.id} missing WSBEditorConfig`)
        assert.match(wsb, /<EditorVersion>.*<\/EditorVersion>/, `${config.id} missing EditorVersion`)
        assert.match(wsb, /<DownloadTime>.*<\/DownloadTime>/, `${config.id} missing DownloadTime`)
        assert.match(wsb, /<Generator>evgo2017\.com<\/Generator>/, `${config.id} missing Generator`)
        assert.match(wsb, /<GeneratedAtISO>.*<\/GeneratedAtISO>/, `${config.id} missing GeneratedAtISO`)
    }
})

test('core generator defaults to evgo2017.com and produces parseable xml', () => {
    const generated = generateWSBXML({
        vGPU: 1,
        Networking: 0,
        AudioInput: 0,
        VideoInput: 0,
        PrinterRedirection: 0,
        ClipboardRedirection: 0,
        ProtectedClient: 0,
        MemoryInMB: '2048',
        LogonCommand: '',
        mappedFolders: []
    }, {
        downloadTime: 1770000000000,
        generatedAtISO: '2026-02-25T00:00:00.000Z'
    })

    assert.equal(generated.ok, true)
    assert.match(generated.xml, /<Generator>evgo2017\.com<\/Generator>/)
    assert.equal(parseWSB(generated.xml)?.MemoryInMB, '2048')
})
