const fs = require('fs');
let code = fs.readFileSync('src/lib/inspections.ts', 'utf8');

// We want to add a few issues to some inspections.
// Let's find "issues: [" in the code and inject some new issues assigned to Diya Patel.

const extraIssues = [
  `{
        id: 'ISS-05101',
        itemPrompt: 'Verify machine guarding is in place',
        state: 'open',
        priority: 'high',
        assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-28T09:00:00Z',
        updatedAt: '2026-05-28T09:00:00Z',
        description: 'Guard on conveyor #3 is loose.',
        comments: []
      },`,
  `{
        id: 'ISS-05102',
        itemPrompt: 'Check calibration tags',
        state: 'in_progress',
        priority: 'medium',
        assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-27T10:00:00Z',
        updatedAt: '2026-05-28T14:00:00Z',
        description: 'Need to replace tags on weight scales.',
        comments: []
      },`,
  `{
        id: 'ISS-05103',
        itemPrompt: 'Ensure emergency exits are clear',
        state: 'awaiting_verification',
        priority: 'high',
        assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-26T08:00:00Z',
        updatedAt: '2026-05-29T08:00:00Z',
        description: 'Boxes were stacked near exit B. Moved them.',
        comments: []
      },`,
  `{
        id: 'ISS-05104',
        itemPrompt: 'Spill kits fully stocked',
        state: 'closed',
        priority: 'low',
        assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-15T08:00:00Z',
        updatedAt: '2026-05-20T08:00:00Z',
        verifiedAt: '2026-05-21T08:00:00Z',
        description: 'Restocked spill kit near chemical storage.',
        comments: []
      },`,
  `{
        id: 'ISS-05105',
        itemPrompt: 'PPE compliance',
        state: 'open',
        priority: 'medium',
        assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-29T10:00:00Z',
        updatedAt: '2026-05-29T10:00:00Z',
        description: 'Worker seen without safety glasses in zone 2.',
        comments: []
      },`
];

let occurence = 0;
code = code.replace(/issues: \[/g, (match) => {
  if (occurence < extraIssues.length) {
    const replacement = match + '\n      ' + extraIssues[occurence];
    occurence++;
    return replacement;
  }
  return match;
});

// Also add a couple more Safety inspections for Kabir Menon
const moreSafety = `
  all.push({
    id: 'INS-04910',
    number: 'INS-04910',
    domain: 'safety',
    templateId: 'tpl_safety_walk',
    templateBaseId: 'tpl_safety_walk',
    templateName: 'Safety walkthrough — Production floor',
    templateVersion: '1.4',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    departmentId: 'dept_prod',
    departmentName: 'Production',
    area: 'Line 2',
    status: 'under_review',
    inspectorId: 'safety.inspector@qmics.io',
    inspectorName: 'Kabir Menon',
    scheduledFor: '2026-05-28T09:00:00Z',
    startedAt: '2026-05-28T09:15:00Z',
    submittedAt: '2026-05-28T11:00:00Z',
    score: 88,
    maxScore: 100,
    issues: [],
    history: []
  });

  all.push({
    id: 'INS-04911',
    number: 'INS-04911',
    domain: 'safety',
    templateId: 'tpl_safety_ppe',
    templateBaseId: 'tpl_safety_ppe',
    templateName: 'PPE compliance audit',
    templateVersion: '1.0',
    siteId: 'site_mumbai',
    siteName: 'Mumbai Line 3',
    departmentId: 'dept_prod',
    departmentName: 'Production',
    area: 'Packaging',
    status: 'draft',
    inspectorId: 'safety.inspector@qmics.io',
    inspectorName: 'Kabir Menon',
    scheduledFor: '2026-05-29T14:00:00Z',
    startedAt: '2026-05-29T14:05:00Z',
    score: null,
    maxScore: 100,
    issues: [
      {
        id: 'ISS-05201',
        itemPrompt: 'Hard hats worn correctly',
        state: 'open',
        priority: 'high',
        assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-29T14:15:00Z',
        updatedAt: '2026-05-29T14:15:00Z',
        description: 'Hard hat missing chin strap.',
        comments: []
      }
    ],
    history: []
  });
`;

code = code.replace(/return all\n\}/, match => moreSafety + '\n  ' + match);

fs.writeFileSync('src/lib/inspections.ts', code);
console.log("Added Employee issues and more Safety inspections.");
