import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import Module from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(apiRoot, '..', '..');

process.env.NODE_PATH = [
  path.join(apiRoot, 'node_modules'),
  path.join(workspaceRoot, 'node_modules'),
  process.env.NODE_PATH
]
  .filter(Boolean)
  .join(path.delimiter);

Module._initPaths();

await import(pathToFileURL(path.join(workspaceRoot, '.npm-cache', 'api-build', 'main.js')).href);
