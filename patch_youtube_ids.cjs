const fs = require('fs');
let code = fs.readFileSync('src/mockData.ts', 'utf8');

const replacementIds = [
  'C3MRJMCBqUw', 
  '6a6O_g0eKx0',
  'jP3R0KibV4I',
  '7PM4rNDr4oI',
  'pY0b5E4-JbY'
];

let idIndex = 0;
code = code.replace(/youtubeId:\s*'[^']+'/g, (match) => {
  const newId = replacementIds[idIndex % replacementIds.length];
  idIndex++;
  return "youtubeId: '" + newId + "'";
});

fs.writeFileSync('src/mockData.ts', code);
console.log('Replaced YouTube IDs');
