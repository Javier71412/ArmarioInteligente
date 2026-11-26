// https://docs.expo.dev/guides/using-eslint/ (flat config, SDK 58, ESLint 9)
// Floor rules from CONSTRAINTS.md §0. Do not weaken them to make a change pass:
// exceptions go here, with a row in CONSTRAINTS.md › Excepciones.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');
const boundaries = require('eslint-plugin-boundaries');

/**
 * Which modules each module may import (only their index.ts). Source: ADR 0006 and
 * spec/capability-map.md. Changing the map means changing this table (and a delta spec).
 */
const ALLOWED_MODULE_DEPENDENCIES = {
  core: [],
  storage: [],
  wardrobe: ['storage', 'core'],
  tagging: ['wardrobe'],
  laundry: ['wardrobe', 'storage', 'core'],
  weather: ['storage'],
  schedule: ['storage', 'core'],
  'outfit-engine': ['wardrobe', 'laundry', 'weather', 'schedule'],
  backup: ['storage', 'wardrobe', 'laundry'],
  today: ['outfit-engine', 'laundry', 'schedule', 'weather', 'core'],
};

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // Inline `eslint-disable` comments have no effect (https://eslint.org/docs/latest/use/configure/configuration-files).
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      'no-empty': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Module boundaries (ADR 0006, https://www.jsboundaries.dev/docs/rules/dependencies/).
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'modules/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'module', pattern: 'src/modules/*', capture: ['name'] },
        { type: 'native', pattern: 'modules/tagging-native' },
        { type: 'route', pattern: 'app' },
      ],
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // Inside one module, imports are free.
            { allow: { dependency: { relationship: { to: 'internal' } } } },
            // Routes may import the index.ts of any module.
            {
              from: { element: { type: 'route' } },
              allow: { to: { element: { type: 'module', fileInternalPath: 'index.ts' } } },
            },
            // Between modules: only the target's index.ts, and only along the capability map.
            ...Object.entries(ALLOWED_MODULE_DEPENDENCIES).map(([name, targets]) => ({
              from: { element: { type: 'module', captured: { name } } },
              allow: {
                to: {
                  element: {
                    type: 'module',
                    captured: { name: targets },
                    fileInternalPath: 'index.ts',
                  },
                },
              },
            })),
            {
              from: { element: { type: 'module', captured: { name: 'tagging' } } },
              allow: { to: { element: { type: 'native' } } },
            },
          ],
        },
      ],
    },
  },
  {
    // domain/ is pure TypeScript: no React, no Expo, no ui/ or data/ (ADR 0006).
    files: ['src/modules/*/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'react-native',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
                '@shopify/*',
              ],
              message: 'domain/ is pure TypeScript: no React or Expo (ADR 0006).',
            },
            {
              group: [
                '../ui',
                '../ui/*',
                '../data',
                '../data/*',
                '@/modules/*/ui/*',
                '@/modules/*/data/*',
              ],
              message: 'domain/ must not import ui/ or data/ (ADR 0006).',
            },
          ],
        },
      ],
    },
  },
  {
    // Node scripts and tool configs.
    files: ['*.js', 'scripts/**/*.js', 'config-tests/**'],
    languageOptions: { globals: globals.node },
  },
  {
    // Trap files: linted on purpose by config-tests/eslint-floor.test.ts with --no-ignore.
    ignores: [
      'dist/*',
      'coverage/*',
      '.expo/*',
      'expo-env.d.ts',
      'eslint-fixtures/*',
      'config-tests/fixtures/**',
    ],
  },
]);
