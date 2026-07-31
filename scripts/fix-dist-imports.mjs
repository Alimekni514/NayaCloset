import { existsSync } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [, , targetDirArg] = process.argv;

if (!targetDirArg) {
  throw new Error('Expected a target directory argument.');
}

const targetDir = path.resolve(process.cwd(), targetDirArg);

const hasExtension = (specifier) => {
  const withoutQuery = specifier.split('?')[0].split('#')[0];
  return /\.(?:js|mjs|cjs|json|node|wasm)$/.test(withoutQuery);
};

const resolveSpecifier = (fromFile, specifier) => {
  if (!specifier.startsWith('.') || hasExtension(specifier)) {
    return specifier;
  }

  const fromDirectory = path.dirname(fromFile);
  const resolvedBase = path.resolve(fromDirectory, specifier);
  const directJsPath = `${resolvedBase}.js`;
  const indexJsPath = path.join(resolvedBase, 'index.js');

  if (existsSync(directJsPath)) {
    return `${specifier}.js`;
  }

  if (existsSync(indexJsPath)) {
    return `${specifier}/index.js`;
  }

  return `${specifier}.js`;
};

const rewriteImports = (source, filePath) =>
  source
    .replace(/(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, (_match, prefix, specifier, suffix) => {
      return `${prefix}${resolveSpecifier(filePath, specifier)}${suffix}`;
    })
    .replace(/(import\s*\(\s*['"])(\.{1,2}\/[^'"]+)(['"]\s*\))/g, (_match, prefix, specifier, suffix) => {
      return `${prefix}${resolveSpecifier(filePath, specifier)}${suffix}`;
    })
    .replace(/(import\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, (_match, prefix, specifier, suffix) => {
      return `${prefix}${resolveSpecifier(filePath, specifier)}${suffix}`;
    })
    .replace(/(require\(\s*['"])(\.{1,2}\/[^'"]+)(['"]\s*\))/g, (_match, prefix, specifier, suffix) => {
      return `${prefix}${resolveSpecifier(filePath, specifier)}${suffix}`;
    });

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await walk(entryPath);
      continue;
    }

    if (!entry.name.endsWith('.js') && !entry.name.endsWith('.d.ts')) {
      continue;
    }

    const original = await readFile(entryPath, 'utf8');
    const rewritten = rewriteImports(original, entryPath);

    if (rewritten !== original) {
      await writeFile(entryPath, rewritten);
    }
  }
};

const exists = async (directory) => {
  try {
    return (await stat(directory)).isDirectory();
  } catch {
    return false;
  }
};

if (!(await exists(targetDir))) {
  throw new Error(`Target directory does not exist: ${targetDir}`);
}

await walk(targetDir);