const fs = require('fs');
let code = fs.readFileSync('src/lib/inspections.ts', 'utf8');

code = code.replace(/priority: '.*',\s*/g, '');
code = code.replace(/description: '.*',\s*/g, '');
code = code.replace(/departmentId: '.*',\s*/g, '');
code = code.replace(/departmentName: '.*',\s*/g, '');
code = code.replace(/score: .*,\s*/g, '');
code = code.replace(/maxScore: .*,\s*/g, '');
code = code.replace(/status: 'draft',/g, "status: 'scheduled',");

fs.writeFileSync('src/lib/inspections.ts', code);
