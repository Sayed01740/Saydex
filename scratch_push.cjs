const fs = require('fs');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const { execSync } = require('child_process');

async function main() {
  const token = execSync('gh auth token').toString().trim();
  console.log('GitHub token acquired.');

  if (fs.existsSync('scratch_push.js')) {
    fs.unlinkSync('scratch_push.js');
  }

  execSync('git add -A');
  console.log('Staged files.');

  execSync('git commit -m "feat: Add 100% Uniswap-like Custom EVM Chain integration with live RPC ping and EIP-3085 sync"');
  console.log('Committed changes.');

  const pushResult = await git.push({
    fs,
    http,
    dir: 'f:/Unx',
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token, password: '' }),
  });
  console.log('Push result:', pushResult);

  if (fs.existsSync('scratch_push.cjs')) {
    fs.unlinkSync('scratch_push.cjs');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
