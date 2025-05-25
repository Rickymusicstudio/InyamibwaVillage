const { execSync } = require('child_process');
const fs = require('fs');

const corruptedFiles = [
  'admin_dashboard.html',
  'cell_inbox.html',
  'cell_leader.html',
  'cell_stats.html',
  'dashboard.html',
  'helpers.html',
  'irondo.html',
  'isibo_dashboard.html',
  'isibo_inbox.html',
  'isibo_leaders.html',
  'my_house_helper.html',
  'my_messages.html',
  'profile.html',
  'security_dashboard.html',
  'security_inbox.html',
  'security_leader.html',
  'security_team.html',
  'thoughts.html',
  'updates.html'
];

const commitHash = '733cf9f';

console.log('🛠 Restoring corrupted files from commit:', commitHash);

corruptedFiles.forEach(file => {
  try {
    const fileContent = execSync(`git show ${commitHash}:${file}`);
    fs.writeFileSync(file, fileContent);
    console.log(`✅ Restored: ${file}`);
  } catch (err) {
    console.error(`❌ Failed to restore ${file}:`, err.message);
  }
});

console.log('🎉 All specified files restored. You can now review and push.');
