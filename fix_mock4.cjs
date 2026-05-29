const fs = require('fs');
let code = fs.readFileSync('src/lib/inspections.ts', 'utf8');

// Fix duplicate verifiedAt
code = code.replace(/verifiedAt: null, assigneeId: 'employee@qmics\.io',\n        assigneeName: 'Diya Patel',\n        createdAt: '2026-05-15T08:00:00Z',\n        updatedAt: '2026-05-20T08:00:00Z',\n        verifiedAt: '2026-05-21T08:00:00Z',/g,
  "assigneeId: 'employee@qmics.io',\n        assigneeName: 'Diya Patel',\n        createdAt: '2026-05-15T08:00:00Z',\n        updatedAt: '2026-05-20T08:00:00Z',\n        verifiedAt: '2026-05-21T08:00:00Z',");

// Fix submittedAt on INS-04911
code = code.replace(/startedAt: '2026-05-29T14:05:00Z',\n    issues: \[/g, "startedAt: '2026-05-29T14:05:00Z',\n    submittedAt: null,\n    issues: [");

fs.writeFileSync('src/lib/inspections.ts', code);
