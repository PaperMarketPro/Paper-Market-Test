const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  /const interval = setInterval\(fetchRealUpstoxLtp, 1500\);/g,
  "const interval = setInterval(fetchRealUpstoxLtp, 5000);"
);

fs.writeFileSync('src/store.tsx', code);
console.log('Patched fetch interval in store.tsx');
