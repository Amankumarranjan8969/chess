import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Detect local IPv4 address
const nets = os.networkInterfaces();
let lanIp = 'localhost';
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
      lanIp = net.address;
      break;
    }
  }
}

console.log('==============================================');
console.log('   🚀 Launching Chess Platform Servers...     ');
console.log('==============================================');
console.log(`📡 Local Wi-Fi IP detected: ${lanIp}`);
console.log(`🔗 Share this with a friend on your Wi-Fi: http://${lanIp}:3000\n`);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Start Authoritative Backend
console.log('\n[1/2] Starting Authoritative Node.js Server on port 4000...');
const serverProcess = spawn(npmCmd, ['run', 'start', '--workspace=@chess/server'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

// 2. Start React + Vite Frontend
console.log('[2/2] Starting React + Vite Frontend on port 3000...');
const webProcess = spawn(npmCmd, ['run', 'dev', '--workspace=@chess/web'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

// Automatically open browser after 1.5 seconds
setTimeout(() => {
  const startCmd = isWindows ? 'start http://localhost:3000' : 'open http://localhost:3000';
  spawn(startCmd, { shell: true, stdio: 'ignore' });
  console.log('\n🌟 Game is ready at http://localhost:3000\n');
}, 1500);

const shutdown = () => {
  console.log('\nStopping servers...');
  serverProcess.kill();
  webProcess.kill();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
