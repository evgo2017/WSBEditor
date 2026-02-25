import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './tests/ui',
    timeout: 60000,
    expect: {
        timeout: 5000
    },
    fullyParallel: true,
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL: 'http://127.0.0.1:13001',
        headless: true,
        acceptDownloads: true
    },
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1 --strictPort --port 13001',
        url: 'http://127.0.0.1:13001',
        timeout: 120000,
        reuseExistingServer: !process.env.CI
    }
})
