const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const fallbackBaseUrl = 'http://localhost:8080/api/v1';

function readBaseUrlFromEnvFile() {
  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return undefined;
  }

  return readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('BASE_URL='))
    ?.slice('BASE_URL='.length);
}

const expoBin = join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'expo.cmd' : 'expo'
);
const args = process.argv.slice(2);
const env = {
  ...process.env,
  EXPO_PUBLIC_BASE_URL: process.env.BASE_URL ?? readBaseUrlFromEnvFile() ?? fallbackBaseUrl,
};

const result = spawnSync(expoBin, args, {
  env,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
