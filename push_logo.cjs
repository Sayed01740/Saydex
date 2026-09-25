const fs = require('fs');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const { execSync } = require('child_process');

async function main() {
  const token = execSync('gh auth token').toString().trim();
  console.log('GitHub token acquired.');

  execSync('git add -A');
  console.log('Staged files.');

  execSync('git commit -m "fix(branding): Add high-contrast light mode SVG logo and dynamic theme switching in BrandLogo"');
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

  if (fs.existsSync('push_logo.cjs')) {
    fs.unlinkSync('push_logo.cjs');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
