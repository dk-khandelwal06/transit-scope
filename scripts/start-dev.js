#!/usr/bin/env node

/**
 * Transit Scope - Development Orchestrator
 * Spawns both the FastAPI Python backend and the Next.js frontend simultaneously.
 */

const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

console.log("\x1b[36m============================================================\x1b[0m");
console.log("\x1b[36m             TRANSIT SCOPE OBSERVATORY LAUNCHER             \x1b[0m");
console.log("\x1b[33m  Teaching a computer to tell a planet from an impostor     \x1b[0m");
console.log("\x1b[36m============================================================\x1b[0m\n");

// 1. Start Python FastAPI backend on port 8000
console.log("\x1b[32m[BACKEND]\x1b[0m Starting FastAPI scientific engine on http://localhost:8000...");
const backendCmd = isWindows ? 'python' : 'python3';
const backend = spawn(backendCmd, ['-m', 'uvicorn', 'backend.app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
  cwd: rootDir,
  env: { ...process.env, PYTHONPATH: rootDir },
  stdio: 'inherit',
  shell: true
});

// 2. Start Next.js frontend on port 3000
console.log("\x1b[34m[FRONTEND]\x1b[0m Starting Next.js observatory UI on http://localhost:3000...");
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const frontend = spawn(npmCmd, ['run', 'dev', '--', '-p', '3000'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log("\n\x1b[33mShutting down Transit Scope services...\x1b[0m");
  try {
    backend.kill();
    frontend.kill();
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

