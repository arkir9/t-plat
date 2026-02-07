#!/usr/bin/env node
'use strict';
// Set Metro packager hostname to LAN IP so physical devices can connect.
const os = require('os');
const { spawnSync } = require('child_process');

function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const host = getLanIp();
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = host;

console.log('Metro packager host:', host);
console.log('iOS Simulator: press i in this terminal after Metro is ready');
console.log('Physical device: in Expo Go enter URL: exp://' + host + ':8081');
console.log('');

const r = spawnSync('npx', ['expo', 'start', '--clear', '--lan'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});
process.exit(r.status != null ? r.status : 1);
