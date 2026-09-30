/**
 * Build the plugin: host bundle (ESM, peers external) + client bundle
 * (window.__ModuleLoader__ CJS wrapper, react/primitives external).
 * esbuild is a local development dependency of this package.
 */
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));

mkdirSync(join(here, 'lib'), { recursive: true });

// ---- host ------------------------------------------------------------------

await esbuild.build({
  entryPoints: [join(here, 'src/host/index.js')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: join(here, 'lib/index.js'),
  external: ['@deepseek-ai/*', 'node:*'],
  sourcemap: false,
  logLevel: 'info',
  legalComments: 'none',
  banner: {
    js: [
      'import { createRequire as __createRequire } from "node:module";',
      'import { fileURLToPath as __fileURLToPath } from "node:url";',
      'import { dirname as __dirnameFn } from "node:path";',
      'const __filename = __fileURLToPath(import.meta.url);',
      'const __dirname = __dirnameFn(__filename);',
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
});

// ---- client ----------------------------------------------------------------

const banner = `window.__ModuleLoader__.load({
	id: "qiaomu-rss-dsh",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
`;
const footer = `
		return module.exports;
	}
});
`;

await esbuild.build({
  entryPoints: [join(here, 'src/client/index.jsx')],
  loader: { '.css': 'text' },
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'chrome120',
  jsx: 'automatic',
  jsxImportSource: 'react',
  outfile: join(here, 'lib/client.js'),
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/*'],
  sourcemap: false,
  logLevel: 'info',
  legalComments: 'none',
  banner: { js: banner },
  footer: { js: footer },
});

const hostSize = statSync(join(here, 'lib/index.js')).size;
const clientSize = statSync(join(here, 'lib/client.js')).size;
console.log(`host   lib/index.js  ${(hostSize / 1024).toFixed(1)} KB`);
console.log(`client lib/client.js ${(clientSize / 1024).toFixed(1)} KB`);
