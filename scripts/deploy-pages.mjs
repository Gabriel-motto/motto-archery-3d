// Builds the site for GitHub Pages and publishes dist/ to the gh-pages
// branch (Pages → "Deploy from a branch": gh-pages / root).
//   npm run deploy
import { execSync } from 'node:child_process';
import { copyFileSync, writeFileSync, rmSync } from 'node:fs';

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const remote = execSync('git remote get-url origin').toString().trim();

run('npm run build', { env: { ...process.env, GITHUB_PAGES: 'true' } });
writeFileSync('dist/.nojekyll', ''); // serve files/folders as-is
copyFileSync('dist/index.html', 'dist/404.html'); // unknown paths get the "missed shot" page

const git = (args) => run(`git ${args}`, { cwd: 'dist' });
rmSync('dist/.git', { recursive: true, force: true });
git('init -q -b gh-pages');
git('add -A');
git('commit -q -m "Deploy to GitHub Pages"');
git(`push -f -q ${remote} gh-pages`);
rmSync('dist/.git', { recursive: true, force: true });
console.log('Published to gh-pages.');
