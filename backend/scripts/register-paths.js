#!/usr/bin/env node
'use strict';
// Register path aliases for runtime (dist/*). Use: node -r scripts/register-paths.js dist/main.js
const path = require('path');
const base = path.resolve(__dirname, '..');
const tsconfigPaths = require('tsconfig-paths');
const runtime = require('../tsconfig.runtime.json');
tsconfigPaths.register({
  baseUrl: base,
  paths: runtime.compilerOptions.paths,
});
