const { execSync } = require('child_process');

try {
  const token = execSync('gh auth token').toString().trim();
  console.log('GitHub token obtained.');

  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat: real on-chain wallet connect/disconnect and pure asset accounting"', { stdio: 'inherit' });
  
  const remoteUrl = `https://${token}@github.com/Sayed01740/Saydex.git`;
  execSync(`git push ${remoteUrl} main`, { stdio: 'inherit' });
  console.log('Successfully pushed to GitHub!');
} catch (err) {
  console.error('Error during push:', err.message);
  process.exit(1);
}
