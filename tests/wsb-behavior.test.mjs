import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { generateWSBXML, getDefaultSandboxPath, parseWSB } from '../src/wsb-core.js'

const rootDir = process.cwd()
const configsJsonPath = path.join(rootDir, 'src', 'configs', 'configs.json')
const configs = JSON.parse(readFileSync(configsJsonPath, 'utf8')).configs
const wsbConfigs = configs.filter((config) => typeof config.file === 'string' && config.file.endsWith('.wsb'))

test('selecting quick config and re-generating keeps semantic content', () => {
    for (const config of wsbConfigs) {
        const absolutePath = path.join(rootDir, 'src', config.file)
        const sourceXml = readFileSync(absolutePath, 'utf8')
        const sourceState = parseWSB(sourceXml)

        assert.ok(sourceState, `failed to parse source wsb for ${config.id}`)

        const generated = generateWSBXML(sourceState, {
            editorVersion: '0.7.0',
            downloadTime: 1770000000000,
            generator: 'evgo2017.com',
            generatedAtISO: '2026-02-25T00:00:00.000Z'
        })

        assert.equal(generated.ok, true, `generation failed for ${config.id}`)

        const roundtripState = parseWSB(generated.xml)
        assert.deepEqual(roundtripState, sourceState, `semantic mismatch after quick-config roundtrip for ${config.id}`)
    }
})

test('editing form state produces expected WSB content', () => {
    const editedState = {
        vGPU: 1,
        Networking: 2,
        AudioInput: 0,
        VideoInput: 2,
        PrinterRedirection: 0,
        ClipboardRedirection: 1,
        ProtectedClient: 2,
        MemoryInMB: '3072',
        LogonCommand: 'cmd /c echo Hello\npowershell -Command "Write-Host Done"',
        mappedFolders: [
            { host: 'D:\\SandboxInput', sandbox: '', readonly: false },
            { host: 'E:\\Docs', sandbox: 'C:\\Users\\WDAGUtilityAccount\\Desktop\\Docs', readonly: true }
        ]
    }

    const generated = generateWSBXML(editedState, {
        editorVersion: '0.7.0',
        downloadTime: 1770000001234,
        generator: 'evgo2017.com',
        generatedAtISO: '2026-02-25T08:00:00.000Z'
    })

    assert.equal(generated.ok, true)
    assert.match(generated.xml, /<Generator>evgo2017\.com<\/Generator>/)

    const parsed = parseWSB(generated.xml)
    assert.equal(parsed.vGPU, 1)
    assert.equal(parsed.Networking, 2)
    assert.equal(parsed.VideoInput, 2)
    assert.equal(parsed.ClipboardRedirection, 1)
    assert.equal(parsed.ProtectedClient, 2)
    assert.equal(parsed.MemoryInMB, '3072')
    assert.equal(parsed.LogonCommand, 'cmd /c echo Hello\npowershell -Command "Write-Host Done"')
    assert.deepEqual(parsed.mappedFolders, [
        {
            host: 'D:\\SandboxInput',
            sandbox: getDefaultSandboxPath('D:\\SandboxInput'),
            readonly: false
        },
        {
            host: 'E:\\Docs',
            sandbox: 'C:\\Users\\WDAGUtilityAccount\\Desktop\\Docs',
            readonly: true
        }
    ])
})

test('invalid memory input is rejected before xml generation', () => {
    const generated = generateWSBXML({
        vGPU: 0,
        Networking: 0,
        AudioInput: 0,
        VideoInput: 0,
        PrinterRedirection: 0,
        ClipboardRedirection: 0,
        ProtectedClient: 0,
        MemoryInMB: '3.5',
        LogonCommand: '',
        mappedFolders: []
    })

    assert.equal(generated.ok, false)
    assert.equal(generated.error, 'invalid_memory')
    assert.equal(generated.xml, null)
})
