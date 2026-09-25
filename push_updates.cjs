const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const token = execSync('gh auth token').toString().trim();
  console.log('GitHub token obtained.');

  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat: ultra-premium UI/UX upgrades - Aurora glow, command palette, live block ticker, audio haptics, quick pills, and hover copy"', { stdio: 'inherit' });

  console.log('Pushing to GitHub with isomorphic-git...');
  const pushResult = await git.push({
    fs,
    http,
    dir: __dirname,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token }),
  });

  console.log('Push result:', pushResult);
  console.log('Successfully pushed commit to GitHub!');
}

main().catch((err) => {
  console.error('Push failed:', err);
  process.exit(1);
});
