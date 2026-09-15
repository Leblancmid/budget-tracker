// deploy-to-laravel.mjs
// Copies the Vite build (frontend/dist) into the Laravel public folder,
// replacing only the SPA's own files (index.html + assets/) and leaving
// Laravel's files (.htaccess, index.php, favicon.ico, robots.txt, storage/, etc.) untouched.
//
// Usage: node deploy-to-laravel.mjs
// Or wire it up automatically via package.json: "postbuild": "node deploy-to-laravel.mjs"

import { existsSync, rmSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Adjust these two paths if your folder layout differs.
const DIST_DIR = join(__dirname, 'dist');                 // frontend/dist (Vite's default output)
const PUBLIC_DIR = join(__dirname, '..', 'backend', 'public'); // Laravel's public folder

function copyRecursive(src, dest) {
  const stat = statSync(src);
  if (stat.isDirectory()) {
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    copyFileSync(src, dest);
  }
}

function main() {
  if (!existsSync(DIST_DIR)) {
    console.error(`✖ Build output not found at ${DIST_DIR}. Did "vite build" run first?`);
    process.exit(1);
  }

  const distIndexHtml = join(DIST_DIR, 'index.html');
  const distAssets = join(DIST_DIR, 'assets');

  if (!existsSync(distIndexHtml) || !existsSync(distAssets)) {
    console.error('✖ Expected dist/index.html and dist/assets/ — build looks incomplete.');
    process.exit(1);
  }

  // 1. Wipe only the old SPA assets folder in public/ (never touches Laravel files)
  const publicAssets = join(PUBLIC_DIR, 'assets');
  if (existsSync(publicAssets)) {
    console.log(`Removing old assets: ${publicAssets}`);
    rmSync(publicAssets, { recursive: true, force: true });
  }

  // 2. Copy the fresh assets folder in
  console.log(`Copying new assets -> ${publicAssets}`);
  copyRecursive(distAssets, publicAssets);

  // 3. Overwrite index.html (the only other file Vite produces at the root)
  const publicIndexHtml = join(PUBLIC_DIR, 'index.html');
  console.log(`Copying index.html -> ${publicIndexHtml}`);
  copyFileSync(distIndexHtml, publicIndexHtml);

  // 4. Copy any other root-level files Vite emitted (e.g. custom favicons from /public in frontend),
  //    but skip anything that would clobber Laravel's own files.
  const laravelOwned = new Set(['.htaccess', 'index.php', 'favicon.ico', 'robots.txt', 'storage']);
  for (const entry of readdirSync(DIST_DIR)) {
    if (entry === 'index.html' || entry === 'assets') continue; // already handled
    if (laravelOwned.has(entry)) {
      console.log(`Skipping "${entry}" — reserved for Laravel, not overwritten.`);
      continue;
    }
    copyRecursive(join(DIST_DIR, entry), join(PUBLIC_DIR, entry));
  }

  console.log('✔ Deploy complete. Old assets cleared, new build copied into backend/public.');
}

main();
