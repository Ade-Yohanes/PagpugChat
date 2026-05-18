const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), '.next', 'dev', 'server', 'app', 'page.js');
const file = fs.readFileSync(filePath, 'utf8');
const lines = file.split('\n');

// Extract semua eval() content dan cari yang ada .length
lines.forEach((line, lineIdx) => {
  if (!line.includes('eval(')) return;

  // Ambil isi string dalam eval()
  const match = line.match(/eval\("(.+)"\)/);
  if (!match) return;

  // Unescape \n jadi newline asli
  let evalContent;
  try {
    evalContent = JSON.parse('"' + match[1] + '"');
  } catch {
    evalContent = match[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  }

  const evalLines = evalContent.split('\n');

  evalLines.forEach((evalLine, evalIdx) => {
    if (evalLine.includes('.length')) {
      console.log(`\n=== outer line ${lineIdx + 1}, inner line ${evalIdx + 1} ===`);
      // Print context: 2 baris sebelum dan sesudah
      const start = Math.max(0, evalIdx - 2);
      const end = Math.min(evalLines.length, evalIdx + 3);
      for (let i = start; i < end; i++) {
        const marker = i === evalIdx ? '>>> ' : '    ';
        console.log(marker + (i + 1) + ': ' + evalLines[i].trim().substring(0, 150));
      }
    }
  });
});