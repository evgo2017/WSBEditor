import { test, expect } from '@playwright/test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const configs = JSON.parse(
    readFileSync(path.join(process.cwd(), 'src', 'configs', 'configs.json'), 'utf8')
).configs

const getConfigName = (id, lang) => {
    const config = configs.find(item => item.id === id)
    if (!config?.name) return 'Sandbox'
    return config.name[lang] || config.name.en || config.name.zh || 'Sandbox'
}

const readDownloadText = async (download) => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'wsb-editor-playwright-'))
    const filePath = path.join(tempDir, download.suggestedFilename())
    await download.saveAs(filePath)
    const content = readFileSync(filePath, 'utf8')
    rmSync(tempDir, { recursive: true, force: true })
    return content
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('WSBEditor_Language', 'en')
        localStorage.removeItem('WSBEditor_StateCache')
    })
    await page.goto('/')
})

test('renders key UI controls', async ({ page }) => {
    await expect(page.getByTestId('quick-config-windows_default')).toBeVisible()
    await expect(page.getByTestId('quick-config-dev_test')).toHaveCount(0)
    await expect(page.getByTestId('filename-input')).toBeVisible()
    await expect(page.getByTestId('memory-input')).toBeVisible()
    await expect(page.getByTestId('mapped-add')).toBeVisible()
    await expect(page.getByTestId('logon-command')).toBeVisible()
    await expect(page.getByTestId('download-wsb')).toBeVisible()
    await expect(page.locator('[data-testid^="mapped-folder-row-"]')).toHaveCount(0)
})

test('form edits generate expected wsb content', async ({ page }) => {
    await page.getByTestId('filename-input').fill('Custom Case')
    await page.getByTestId('memory-input').fill('3072')
    await page.getByTestId('mapped-add').click()
    await page.getByTestId('mapped-host-0').fill('D:\\SandboxInput')
    await page.getByTestId('mapped-readonly-0').selectOption({ index: 1 })
    await page.getByTestId('logon-command').fill('cmd /c echo Hello\npowershell -Command "Write-Host Done"')

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('download-wsb').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('Custom Case.wsb')

    const xml = await readDownloadText(download)
    expect(xml).toContain('<MemoryInMB>3072</MemoryInMB>')
    expect(xml).toContain('<HostFolder>D:\\SandboxInput</HostFolder>')
    expect(xml).toContain('<SandboxFolder>C:\\Users\\WDAGUtilityAccount\\Desktop\\SandboxInput</SandboxFolder>')
    expect(xml).toContain('<ReadOnly>true</ReadOnly>')
    expect(xml).toContain('<Command>cmd /c echo Hello</Command>')
    expect(xml).toContain('<Command>powershell -Command &quot;Write-Host Done&quot;</Command>')
    expect(xml).toContain('<Generator>evgo2017.com</Generator>')
})

test('quick config applies preset and locale-specific filename', async ({ page }) => {
    await page.getByTestId('quick-config-isolated').click()
    await expect(page.getByTestId('filename-input')).toHaveValue(getConfigName('isolated', 'en'))
    await expect(page.getByTestId('memory-input')).toHaveValue('4096')

    let downloadPromise = page.waitForEvent('download')
    await page.getByTestId('download-wsb').click()
    let download = await downloadPromise
    let xml = await readDownloadText(download)

    expect(xml).toContain('<vGPU>Disable</vGPU>')
    expect(xml).toContain('<Networking>Disable</Networking>')
    expect(xml).toContain('<MemoryInMB>4096</MemoryInMB>')
    expect(xml).toContain('<ProtectedClient>Enable</ProtectedClient>')
    expect(xml).not.toContain('<MappedFolders>')

    await page.getByTestId('lang-zh').click()
    await page.getByTestId('quick-config-isolated').click()
    await expect(page.getByTestId('filename-input')).toHaveValue(getConfigName('isolated', 'zh'))
})
