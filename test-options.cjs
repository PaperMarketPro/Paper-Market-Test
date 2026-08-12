const ts = require('typescript');
const fs = require('fs');
const content = fs.readFileSync('src/components/Markets.tsx', 'utf8');
console.log(content.includes('getDynamicOptionChain'));
