#!/usr/bin/env node
import { readdir, stat } from 'fs/promises';
import { join, basename, relative } from 'path';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', '.git', 'build', 'coverage', '.vercel', '.turbo', '.claude'];
const ROOT = process.cwd();

const duplicates = {
  byName: new Map(),
  byHash: new Map(),
  configs: []
};

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        yield* walk(path);
      }
    } else {
      yield path;
    }
  }
}

function getHash(filePath) {
  try {
    const content = readFileSync(filePath);
    return createHash('md5').update(content).digest('hex');
  } catch {
    return null;
  }
}

console.log('\n================================================================');
console.log('  FinalizaBOT - Verificacao de Arquivos Duplicados');
console.log('================================================================\n');

console.log('1. Procurando arquivos duplicados...\n');

for await (const filePath of walk(ROOT)) {
  const name = basename(filePath);
  const relPath = relative(ROOT, filePath);

  // Agrupar por nome
  if (!duplicates.byName.has(name)) {
    duplicates.byName.set(name, []);
  }
  duplicates.byName.get(name).push(relPath);

  // Detectar arquivos de configuração
  const configPatterns = [
    'package.json', 'tsconfig.json', '.env', '.env.example',
    '.gitignore', '.prettierrc', '.eslintrc', 'README.md'
  ];

  if (configPatterns.some(pattern => name.includes(pattern))) {
    duplicates.configs.push({ name, path: relPath });
  }
}

// Filtrar apenas duplicados reais
const nameDuplicates = Array.from(duplicates.byName.entries())
  .filter(([_, paths]) => paths.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log('================================================================');
console.log('  RESULTADOS');
console.log('================================================================\n');

console.log(`Arquivos com nome duplicado: ${nameDuplicates.length}\n`);

if (nameDuplicates.length > 0) {
  console.log('TOP 15 ARQUIVOS DUPLICADOS:\n');

  nameDuplicates.slice(0, 15).forEach(([name, paths]) => {
    console.log(`  ${name} (${paths.length} ocorrencias):`);
    paths.forEach(path => {
      console.log(`    - ${path}`);
    });
    console.log('');
  });
}

// Arquivos de configuração
console.log('\nARQUIVOS DE CONFIGURACAO:\n');

const configGroups = {};
duplicates.configs.forEach(({ name, path }) => {
  const key = name.replace(/\.\w+$/, ''); // Remove extensão
  if (!configGroups[key]) configGroups[key] = [];
  configGroups[key].push(path);
});

Object.entries(configGroups).forEach(([name, paths]) => {
  if (paths.length > 1) {
    console.log(`  ${name}* (${paths.length} arquivos):`);
    paths.forEach(path => console.log(`    - ${path}`));
    console.log('');
  }
});

// Componentes React
console.log('\nCOMPONENTES REACT (.tsx/.jsx):\n');

const componentDupes = nameDuplicates.filter(([name]) =>
  name.endsWith('.tsx') || name.endsWith('.jsx')
);

if (componentDupes.length > 0) {
  console.log(`  Componentes com mesmo nome: ${componentDupes.length}\n`);
  componentDupes.forEach(([name, paths]) => {
    console.log(`    ${name}:`);
    paths.forEach(path => console.log(`      - ${path}`));
    console.log('');
  });
} else {
  console.log('  Nenhum componente duplicado encontrado!\n');
}

// Sumário
console.log('================================================================');
console.log('  RESUMO');
console.log('================================================================\n');

const packageJsons = duplicates.configs.filter(c => c.name === 'package.json');
const tsconfigs = duplicates.configs.filter(c => c.name === 'tsconfig.json');
const envFiles = duplicates.configs.filter(c => c.name.startsWith('.env'));

console.log(`  package.json: ${packageJsons.length} arquivos`);
console.log(`  tsconfig.json: ${tsconfigs.length} arquivos`);
console.log(`  .env*: ${envFiles.length} arquivos`);
console.log(`  Componentes duplicados: ${componentDupes.length}`);
console.log(`  Total de nomes duplicados: ${nameDuplicates.length}`);

console.log('\n================================================================');
console.log('  RECOMENDACOES');
console.log('================================================================\n');

if (packageJsons.length > 3) {
  console.log('  OK Monorepo detectado - multiplos package.json esperados');
}

if (componentDupes.length > 0) {
  console.log('  AVISO: Revisar componentes duplicados - considere consolidacao');
}

if (nameDuplicates.length > 50) {
  console.log('  AVISO: Muitos arquivos duplicados - revisar estrutura do projeto');
} else if (nameDuplicates.length === 0) {
  console.log('  OK Nenhum arquivo duplicado critico encontrado!');
}

console.log('\n================================================================\n');
