#!/usr/bin/env node

/**
 * Capacitor Build Script
 *
 * Handles static export build for Capacitor by temporarily
 * excluding API routes (which run on Vercel in production).
 *
 * Usage: node scripts/capacitor-build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'app');
const API_DIR = path.join(APP_DIR, 'api');
const API_BACKUP_DIR = path.join(APP_DIR, '_api_backup');
const ACTIONS_DIR = path.join(APP_DIR, 'actions');
const ACTIONS_BACKUP_DIR = path.join(APP_DIR, '_actions_backup');
const BOTTLE_DIR = path.join(APP_DIR, 'bottle');
const BOTTLE_BACKUP_DIR = path.join(APP_DIR, '_bottle_backup');

// SSR pages that need to be swapped with client versions for Capacitor build
const SSR_PAGES = [
  { dir: '.', file: 'page.tsx' }, // Root page
  { dir: 'cellar', file: 'page.tsx' },
  { dir: 'cellar/add', file: 'page.tsx' },
  { dir: 'dashboard', file: 'page.tsx' },
  { dir: 'settings', file: 'page.tsx' },
];

// SSR components that need to be swapped with client versions
const SSR_COMPONENTS = [
  { dir: 'components/layout', file: 'nav-wrapper.tsx', clientFile: 'nav-wrapper.client.tsx' },
];

console.log('🏗️  Starting Capacitor build...\n');
console.log('📝 Note: API routes will run on Vercel, called via HTTPS from native app\n');

// Step 1: Backup API routes and server actions (incompatible with static export)
console.log('📦 Backing up server-only code...');

if (fs.existsSync(API_DIR)) {
  if (fs.existsSync(API_BACKUP_DIR)) {
    fs.rmSync(API_BACKUP_DIR, { recursive: true, force: true });
  }
  fs.renameSync(API_DIR, API_BACKUP_DIR);
  console.log('  ✓ API routes backed up (will run on Vercel)');
}

if (fs.existsSync(ACTIONS_DIR)) {
  if (fs.existsSync(ACTIONS_BACKUP_DIR)) {
    fs.rmSync(ACTIONS_BACKUP_DIR, { recursive: true, force: true });
  }
  fs.renameSync(ACTIONS_DIR, ACTIONS_BACKUP_DIR);
  console.log('  ✓ Server actions backed up (incompatible with static export)');
}

if (fs.existsSync(BOTTLE_DIR)) {
  if (fs.existsSync(BOTTLE_BACKUP_DIR)) {
    fs.rmSync(BOTTLE_BACKUP_DIR, { recursive: true, force: true });
  }
  fs.renameSync(BOTTLE_DIR, BOTTLE_BACKUP_DIR);
  console.log('  ✓ Bottle routes backed up (dynamic routes excluded from static export)');
}

// Step 1.5: Swap SSR pages with client versions
console.log('\n🔄 Swapping SSR pages with client versions...');
for (const { dir, file } of SSR_PAGES) {
  const ssrPath = path.join(APP_DIR, dir, file);
  const clientPath = path.join(APP_DIR, dir, 'page.client.tsx');
  const backupPath = path.join(APP_DIR, dir, 'page.ssr.bak');

  if (fs.existsSync(ssrPath) && fs.existsSync(clientPath)) {
    // Backup SSR version
    fs.renameSync(ssrPath, backupPath);
    // Copy client version to page.tsx
    fs.copyFileSync(clientPath, ssrPath);
    console.log(`  ✓ Swapped ${dir}/page.tsx with client version`);
  }
}

// Step 1.6: Swap SSR components with client versions
console.log('\n🔄 Swapping SSR components with client versions...');
for (const { dir, file, clientFile } of SSR_COMPONENTS) {
  const componentDir = path.join(__dirname, '..', dir);
  const ssrPath = path.join(componentDir, file);
  const clientPath = path.join(componentDir, clientFile);
  const backupPath = path.join(componentDir, file.replace('.tsx', '.ssr.bak'));

  if (fs.existsSync(ssrPath) && fs.existsSync(clientPath)) {
    // Backup SSR version
    fs.renameSync(ssrPath, backupPath);
    // Copy client version
    fs.copyFileSync(clientPath, ssrPath);
    console.log(`  ✓ Swapped ${dir}/${file} with client version`);
  }
}

console.log('✓ Server-only code backed up\n');

try {
  // Step 2: Run Next.js build with static export
  console.log('🔨 Building static export for Capacitor...');
  execSync('CAPACITOR_BUILD=true npm run build', {
    stdio: 'inherit',
    env: { ...process.env, CAPACITOR_BUILD: 'true' }
  });
  console.log('\n✓ Build completed successfully\n');
} catch (error) {
  console.error('\n❌ Build failed\n');
  throw error;
} finally {
  // Step 3: Restore backed up code for web development
  console.log('♻️  Restoring code for web development...');

  if (fs.existsSync(API_BACKUP_DIR)) {
    if (fs.existsSync(API_DIR)) {
      fs.rmSync(API_DIR, { recursive: true, force: true });
    }
    fs.renameSync(API_BACKUP_DIR, API_DIR);
    console.log('  ✓ API routes restored');
  }

  if (fs.existsSync(ACTIONS_BACKUP_DIR)) {
    if (fs.existsSync(ACTIONS_DIR)) {
      fs.rmSync(ACTIONS_DIR, { recursive: true, force: true });
    }
    fs.renameSync(ACTIONS_BACKUP_DIR, ACTIONS_DIR);
    console.log('  ✓ Server actions restored');
  }

  if (fs.existsSync(BOTTLE_BACKUP_DIR)) {
    if (fs.existsSync(BOTTLE_DIR)) {
      fs.rmSync(BOTTLE_DIR, { recursive: true, force: true });
    }
    fs.renameSync(BOTTLE_BACKUP_DIR, BOTTLE_DIR);
    console.log('  ✓ Bottle routes restored');
  }

  // Restore SSR pages
  console.log('\n🔄 Restoring SSR pages...');
  for (const { dir, file } of SSR_PAGES) {
    const ssrPath = path.join(APP_DIR, dir, file);
    const backupPath = path.join(APP_DIR, dir, 'page.ssr.bak');

    if (fs.existsSync(backupPath)) {
      // Remove client version
      if (fs.existsSync(ssrPath)) {
        fs.rmSync(ssrPath, { force: true });
      }
      // Restore SSR version
      fs.renameSync(backupPath, ssrPath);
      console.log(`  ✓ Restored ${dir}/page.tsx (SSR version)`);
    }
  }

  // Restore SSR components
  console.log('\n🔄 Restoring SSR components...');
  for (const { dir, file } of SSR_COMPONENTS) {
    const componentDir = path.join(__dirname, '..', dir);
    const ssrPath = path.join(componentDir, file);
    const backupPath = path.join(componentDir, file.replace('.tsx', '.ssr.bak'));

    if (fs.existsSync(backupPath)) {
      // Remove client version
      if (fs.existsSync(ssrPath)) {
        fs.rmSync(ssrPath, { force: true });
      }
      // Restore SSR version
      fs.renameSync(backupPath, ssrPath);
      console.log(`  ✓ Restored ${dir}/${file} (SSR version)`);
    }
  }

  console.log('✓ All code restored\n');
}

console.log('✅ Capacitor build complete!\n');
console.log('📱 Next steps:');
console.log('   1. npm run capacitor:sync (syncs /out to iOS/Android)');
console.log('   2. npm run ios:open (opens Xcode)');
console.log('   3. Test camera in iOS simulator\n');
