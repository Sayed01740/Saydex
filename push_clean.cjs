const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const { execSync } = require('child_process');

async function main() {
  const dir = path.resolve('F:/Unx');
  
  execSync('git add -A', { cwd: dir, stdio: 'inherit' });
  
  try {
    execSync('git commit -m "refactor(ui): streamline navbar, remove visual clutter and empty card noise, optimize animations for ultra-smooth 60fps performance"', { cwd: dir, stdio: 'inherit' });
  } catch (e) {
    console.log('Commit note:', e.message);
  }

  const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
  if (!token) {
    throw new Error('No GH token available');
  }

  console.log('Pushing to GitHub via isomorphic-git...');
  await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token, password: '' }),
  });

  console.log('Successfully pushed to GitHub main branch!');
}

main().catch(err => {
  console.error('Push failed:', err);
  process.exit(1);
});
