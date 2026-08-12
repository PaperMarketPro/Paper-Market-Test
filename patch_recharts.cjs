const fs = require('fs');
let code = fs.readFileSync('src/components/Markets.tsx', 'utf8');

code = code.replace(
  /<ResponsiveContainer width="100%" height="100%">\s*<AreaChart data=\{inst.sparkline.map\(\(val, idx\) => \(\{ idx, val \}\)\)\}>/g,
  `<AreaChart width={96} height={40} data={inst.sparkline.map((val, idx) => ({ idx, val }))}>`
);

code = code.replace(
  /<\/AreaChart>\s*<\/ResponsiveContainer>/g,
  `</AreaChart>`
);

fs.writeFileSync('src/components/Markets.tsx', code);
console.log('Patched recharts ResponsiveContainer out in Markets.tsx');
