const fs = require('fs');
let code = fs.readFileSync('src/lib/inspections.ts', 'utf8');

// We want to replace some 'assigneeId' and 'assigneeName' in issues.
// Let's randomly assign some issues to Diya Patel.
code = code.replace(/assigneeId: '.*?'/g, (match, offset) => {
  if (Math.random() < 0.3) {
    return "assigneeId: 'employee@qmics.io'";
  }
  return match;
});

code = code.replace(/assigneeName: '.*?'/g, (match, offset) => {
  // If the preceding assigneeId was employee@qmics.io, we should change the name to Diya Patel
  // Wait, regex replace won't easily correlate. Let's do it safely.
  return match;
});

// A better way is to do string replacement for specific assignee IDs to employee@qmics.io
