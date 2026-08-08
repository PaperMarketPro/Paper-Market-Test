const fs = require('fs');
let code = fs.readFileSync('src/components/StockChart.tsx', 'utf8');

const target1 = `  const computeIndicators = useCallback((rawCandles: Candle[]): Candle[] => {
    if (rawCandles.length === 0) return [];
    
    // Create shallow copies of candle objects to bypass read-only property errors from frozen react states
    const data = rawCandles.map(c => ({ ...c }));`;

const replace1 = `  const computeIndicators = useCallback((rawCandles: Candle[], inPlace = false): Candle[] => {
    if (rawCandles.length === 0) return [];
    
    // Create shallow copies of candle objects to bypass read-only property errors from frozen react states
    const data = inPlace ? rawCandles : rawCandles.map(c => ({ ...c }));`;

const target2 = `        updated[updated.length - 1] = updatedLast;
        
        // Re-compute indicators so lines follow live ticks flawlessly
        return computeIndicators(updated);`;

const replace2 = `        updated[updated.length - 1] = updatedLast;
        
        // Re-compute indicators so lines follow live ticks flawlessly
        return computeIndicators(updated, true);`;

if (code.includes(target1) && code.includes(target2)) {
  code = code.replace(target1, replace1).replace(target2, replace2);
  fs.writeFileSync('src/components/StockChart.tsx', code);
  console.log("Patch 2 applied successfully!");
} else {
  console.log("Patch 2 target not found");
}
