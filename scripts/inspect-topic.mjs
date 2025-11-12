import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tsConfigPaths from 'tsconfig-paths';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsConfig = await import('../tsconfig.json', { with: { type: 'json' } });
const baseUrl = path.resolve(__dirname, '..', tsConfig.default.compilerOptions.baseUrl || '.');
tsConfigPaths.register({ baseUrl, paths: tsConfig.default.compilerOptions.paths || {} });
const { getTopicEntityData } = await import('../src/lib/entities.ts');
const slug = process.argv[2] || 'ancient-serbia-civilization';
const data = getTopicEntityData(slug);
console.log(JSON.stringify({
  label: data?.label,
  hasDescription: !!data?.description?.trim(),
  description: data?.description,
  episodeCount: data?.episodes.length,
  yearRange: data?.yearRangeLabel,
  pending: data?.isPending
}, null, 2));
