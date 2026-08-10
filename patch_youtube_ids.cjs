const fs = require('fs');
let code = fs.readFileSync('src/mockData.ts', 'utf8');

// Replace standard ones
const replaceMap = {
  'p7HKvqRI_Bo': 'gMfOfr6A9Xw', // Stock Market Basics
  'yN7y1p50lY8': 'tGFQlwt9Oi4', // OHLC
  'gFS_5XG1Lmg': 'HSizIZmsJP8', // Support/Resistance
  '3UIT2d4_2sI': '7EpktRs-XCw', // Call/Put options
  '2v-s8W2W01M': 'OiKICOz8oXo', // Live option chain
  'J8m3T5gC11s': 'tW13N4Hll88', // Candlestick patterns
  '9k3P2qX_s9Y': 'gb7nNveNBjg', // Risk management
  'Xm7P2qX_s9Z': 'gb7nNveNBjg',
  '7kXqX8M2x9I': 'tW13N4Hll88',
  'z1_P4X8m4qA': 'dXi97O2kc-8',
  'Hk9sZq9x9-k': 'tW13N4Hll88',
};

Object.keys(replaceMap).forEach(oldId => {
  const newId = replaceMap[oldId];
  const oldRegex = new RegExp(`youtubeId:\\s*'${oldId}'`, 'g');
  const urlRegex = new RegExp(`https:\\/\\/www\\.youtube\\.com\\/watch\\?v=${oldId}`, 'g');
  
  code = code.replace(oldRegex, `youtubeId: '${newId}'`);
  code = code.replace(urlRegex, `https://www.youtube.com/watch?v=${newId}`);
});

fs.writeFileSync('src/mockData.ts', code);
console.log('Successfully updated YouTube IDs in mockData.ts');
