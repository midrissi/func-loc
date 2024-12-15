import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {

    ignores: [
      'dist/*',
      'node_modules/**',
      '!.eslintrc.js',
      'coverage/**',
      '.nyc_output/',
      'tmp/**',
      '__tests__/assets/**',
    ],
  },
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error', 'info', 'table'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^[_e]',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^[_e]',
          destructuredArrayIgnorePattern: '^[_e]',
          varsIgnorePattern: '^[_e]',
          ignoreRestSiblings: true,
        },
      ],
    }
  }
);
