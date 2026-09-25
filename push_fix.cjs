const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const { execSync } = require('child_process');

async function main() {
  const dir = path.resolve('F:/Unx');
  
  // stage all changes
  execSync('git add -A', { cwd: dir, stdio: 'inherit' });
  
  // commit
  try {
    execSync('git commit -m "fix(ui): eliminate testnet badge collision with Portfolio nav tab and add native testnet banner in Portfolio"', { cwd: dir, stdio: 'inherit' });
  } catch (e) {
    console.log('Commit note:', e.message);
  }

  // get gh auth token
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
