const fs = require('fs');
const path = require('path');

const weights = {
    300: 'outfit-300.woff2',
    400: 'outfit-400.woff2',
    500: 'outfit-500.woff2',
    600: 'outfit-600.woff2'
};

let css = '';

for (const [weight, filename] of Object.entries(weights)) {
    if (fs.existsSync(filename)) {
        const base64 = fs.readFileSync(filename).toString('base64');
        css += `
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url(data:font/woff2;base64,${base64}) format('woff2');
}
`;
        console.log(`Processed weight ${weight} (${filename})`);
    } else {
        console.warn(`File not found: ${filename}`);
    }
}

fs.writeFileSync('font-face.css', css);
console.log('CSS generated in font-face.css');
