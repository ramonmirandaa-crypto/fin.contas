import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

async function resolveViteBinary({ attemptedInstall = false } = {}) {
  try {
    const vitePkgPath = require.resolve('vite/package.json');
    const resolvedPath = path.join(path.dirname(vitePkgPath), 'bin', 'vite.js');
    await access(resolvedPath, constants.F_OK);
    return resolvedPath;
  } catch (error) {
    if (attemptedInstall) {
      throw new Error(
        'Vite binary is still missing after attempting to restore dependencies. Check the installation logs for details.',
        { cause: error },
      );
    }

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

      install.on('error', reject);
    });

    return resolveViteBinary({ attemptedInstall: true });
  }
}

async function runVite() {
  const viteBinary = await resolveViteBinary();

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
