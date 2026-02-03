const fs = require('fs');
const path = require('path');

const CONFIGS_DIR = path.join(__dirname, 'configs');
const SRC_HTML = path.join(__dirname, 'WSBEditor.src.html');
const OUTPUT_HTML = path.join(__dirname, 'WSBEditor.html');

function sync() {
    console.log(`Syncing configs from ${CONFIGS_DIR} to ${OUTPUT_HTML}...`);

    // 1. Read configs.json
    const configsJsonPath = path.join(CONFIGS_DIR, 'configs.json');
    if (!fs.existsSync(configsJsonPath)) {
        console.error('configs.json not found!');
        return;
    }
    const metaData = JSON.parse(fs.readFileSync(configsJsonPath, 'utf8'));

    // 2. Read languages.json
    const languagesPath = path.join(CONFIGS_DIR, 'languages.json');
    let languagesData = {};
    if (fs.existsSync(languagesPath)) {
        languagesData = JSON.parse(fs.readFileSync(languagesPath, 'utf8'));
    }

    // 3. Collect all WSB files referenced
    const embeddedWsbs = {};
    (metaData.configs || []).forEach(config => {
        if (config.type === 'file' && config.file) {
            const key = config.embeddedKey || config.id;
            const wsbPath = path.join(__dirname, config.file.replace(/\//g, path.sep));
            if (fs.existsSync(wsbPath)) {
                embeddedWsbs[key] = fs.readFileSync(wsbPath, 'utf8').trim();
            } else {
                console.warn(`Warning: File ${wsbPath} not found.`);
            }
        }
    });

    // 4. Read HTML content
    let content = fs.readFileSync(SRC_HTML, 'utf8');

    // 5. Update JSON Data Blocks
    const updateJsonBlock = (id, data) => {
        const regex = new RegExp(`(<script id="${id}" type="application\\/json">)[\\s\\S]*?(<\\/script>)`);
        if (regex.test(content)) {
            content = content.replace(regex, `$1\n${JSON.stringify(data, null, 4)}\n$2`);
        } else {
            console.warn(`Warning: Could not find #${id} script tag in HTML.`);
        }
    };

    updateJsonBlock('EmbeddedConfigsData', metaData.configs);
    updateJsonBlock('TranslationsData', languagesData);

    // 6. Update XML Data Blocks
    let wsbBlocks = "";
    Object.entries(embeddedWsbs).forEach(([key, xml]) => {
        wsbBlocks += `\n    <script id="wsb_data_${key}" type="application/xml">\n${xml}\n    </script>`;
    });

    const xmlRegex = /<!-- WSB_DATA_START -->[\s\S]*?<!-- WSB_DATA_END -->/;
    if (xmlRegex.test(content)) {
        content = content.replace(xmlRegex, `<!-- WSB_DATA_START -->${wsbBlocks}\n    <!-- WSB_DATA_END -->`);
    } else {
        console.error('Could not find WSB_DATA placeholders in HTML.');
    }

    // 7. Write back
    fs.writeFileSync(OUTPUT_HTML, content, 'utf8');
    console.log("Done! Configs and Languages synced successfully.");
}

sync();
