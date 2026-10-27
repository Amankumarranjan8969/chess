import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('==============================================');
console.log('   🚀 Launching Chess Platform Servers...     ');
console.log('==============================================');

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
