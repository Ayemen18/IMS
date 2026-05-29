const fs = require('fs');
let code = fs.readFileSync('src/lib/inspections.ts', 'utf8');

// Fix Issues
code = code.replace(/assigneeId: 'employee@qmics.io',/g, "itemId: 'item_mock', fixSubmittedAt: null, verifiedAt: null, assigneeId: 'employee@qmics.io',");

// Fix Inspections missing fields
code = code.replace(/timeline: \[\],?/g, "managerId: 'usr_admin', managerName: 'Admin', reviewedAt: null, publishedAt: null, responses: [], createdAt: '2026-05-28T09:00:00Z', updatedAt: '2026-05-28T09:00:00Z', timeline: []");

fs.writeFileSync('src/lib/inspections.ts', code);
