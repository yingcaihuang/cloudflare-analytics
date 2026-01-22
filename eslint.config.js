const js = require('@eslint/js');
const reactPlugin = require('eslint-plugin-react');
const reactNativePlugin = require('eslint-plugin-react-native');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-native': reactNativePlugin,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        exports: 'writable',
        global: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'warn',
    },
  },
  {
    // Ignore TypeScript files until typescript-eslint can be installed
    ignores: ['**/*.ts', '**/*.tsx'],
  },
  prettierConfig,
];
