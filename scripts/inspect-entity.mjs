import path from 'node:path';
import { pathToFileURL } from 'node:url';
import module from 'node:module';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const register = module.createRequire(import.meta.url);
register.extensions['.ts'] = (module, filename) => {
  require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
  require.extensions['.ts'](module, filename);
};
