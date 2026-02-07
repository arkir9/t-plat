#!/usr/bin/env node
'use strict';
// Fast dev: use tsc (already fast) + node --watch. No Nest CLI - quicker startup and rebuilds.
const path = require('path');
const { execSync, spawn } = require('child_process');

const backendDir = path.resolve(__dirname);

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', shell: true, cwd: backendDir, ...opts });
}

// One-time build so dist/ exists
run('npx tsc -p tsconfig.json');

// Watch: tsc -w in background; node --watch runs and restarts when dist changes
const tsc = spawn('npx', ['tsc', '-p', 'tsconfig.json', '-w'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});
const node = spawn('node', ['-r', './scripts/register-paths.js', '--watch', 'dist/main.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

function killAll() {
  try { tsc.kill(); } catch (_) {}
  try { node.kill(); } catch (_) {}
}
process.on('SIGINT', () => { killAll(); process.exit(0); });
process.on('SIGTERM', () => { killAll(); process.exit(0); });
node.on('exit', (code) => { killAll(); process.exit(code ?? 0); });
