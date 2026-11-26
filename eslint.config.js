// https://docs.expo.dev/guides/using-eslint/ (flat config, SDK 58, ESLint 9)
// Floor rules from CONSTRAINTS.md §0. Do not weaken them to make a change pass:
// exceptions go here, with a row in CONSTRAINTS.md › Excepciones.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');

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
