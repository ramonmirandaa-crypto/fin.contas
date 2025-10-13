import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const viteBinary = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

async function ensureViteBinary() {
  try {
    await access(viteBinary, constants.F_OK);
    return;
  } catch {
    console.warn('[dev] Vite binary not found. Running "npm install" to restore dependencies...');

    await new Promise((resolve, reject) => {
      const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const install = spawn(npmExecutable, ['install'], {
        cwd: projectRoot,
        stdio: 'inherit',
        env: process.env,
      });

      install.on('exit', (code, signal) => {
        if (code === 0) {
          resolve();
        } else if (signal) {
          reject(new Error(`"npm install" terminated via signal ${signal}`));
        } else {
          reject(new Error(`"npm install" exited with code ${code ?? 'unknown'}`));
        }
      });

      install.on('error', (error) => {
        reject(error);
      });
    });

    try {
      await access(viteBinary, constants.F_OK);
    } catch (error) {
      throw new Error(
        'Vite binary is still missing after running "npm install". Check the installation logs for details.',
        { cause: error },
      );
    }
  }
}

async function runVite() {
  await ensureViteBinary();

  const viteProcess = spawn(process.execPath, [viteBinary, ...process.argv.slice(2)], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? 'development' },
  });

  viteProcess.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });

  viteProcess.on('error', (error) => {
    console.error('[dev] Failed to launch Vite:', error);
    process.exit(1);
  });
}

runVite().catch((error) => {
  console.error('[dev] Unable to start the development server:', error);
  process.exit(1);
});
