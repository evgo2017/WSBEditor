const fs = require('fs');
const fontCss = fs.readFileSync('font-face.css', 'utf8');
const originalCss = fs.readFileSync('src/style.css', 'utf8');

// Prepend font face to style.css
fs.writeFileSync('src/style.css', fontCss + '\n' + originalCss);
console.log('Fonts embedded into src/style.css');
