import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginNext from '@next/eslint-plugin-next';
import pluginPrettier from 'eslint-plugin-prettier';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  { ignores: ['.next/', 'node_modules/', 'out/', '*.config.*', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      next: pluginNext,
      prettier: pluginPrettier,
    },
    settings: {
      react: { version: '18.3' },
      next: { rootDir: '.' },
    },
    rules: {
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      ...Object.fromEntries(
        Object.entries(pluginNext.configs.recommended.rules).map(([key, value]) => [
          key.replace(/^@next\/next\//, 'next/'),
          value,
        ])
      ),
      ...Object.fromEntries(
        Object.entries(pluginNext.configs['core-web-vitals'].rules).map(([key, value]) => [
          key.replace(/^@next\/next\//, 'next/'),
          value,
        ])
      ),
    },
    languageOptions: {
      parserOptions: {
        project: resolve(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
  },
];