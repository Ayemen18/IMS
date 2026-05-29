const fs = require('fs');
let code = fs.readFileSync('src/lib/inspections.ts', 'utf8');

code = code.replace(/comments: \[\],?\s*/g, '');
code = code.replace(/history: \[\],?\s*/g, 'timeline: [],\n');

fs.writeFileSync('src/lib/inspections.ts', code);
