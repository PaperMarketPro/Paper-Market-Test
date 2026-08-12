const fs = require('fs');
let code = fs.readFileSync('src/components/Markets.tsx', 'utf8');

// Fix opening tags
code = code.replace(
  /<ResponsiveContainer width="100%" height="100%">\s*<AreaChart data=\{inst.sparkline.map\(\(val, i\) => \(\{ Tick: `T\$\{i\}`, Price: val \}\)\)\}>/g,
  `<AreaChart width={140} height={40} data={inst.sparkline.map((val, i) => ({ Tick: \`T\${i}\`, Price: val }))}>`
);

code = code.replace(
  /<ResponsiveContainer width="100%" height="100%">/g,
  ''
);

code = code.replace(
  /<\/ResponsiveContainer>/g,
  ''
);

fs.writeFileSync('src/components/Markets.tsx', code);
console.log('Fixed Recharts in Markets.tsx');
