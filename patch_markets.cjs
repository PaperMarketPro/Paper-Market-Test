const fs = require('fs');
let code = fs.readFileSync('src/components/Markets.tsx', 'utf8');

code = code.replace(
  /const \[visibleCount, setVisibleCount\] = useState\(50\);/g,
  "const [visibleCount, setVisibleCount] = useState(20);"
);

code = code.replace(
  /setVisibleCount\(prev => prev \+ 50\)/g,
  "setVisibleCount(prev => prev + 20)"
);

fs.writeFileSync('src/components/Markets.tsx', code);
console.log('Reduced visibleCount in Markets.tsx');
