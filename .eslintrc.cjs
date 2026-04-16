module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:preact/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          { target: './src/domain', from: './src/infrastructure' },
          { target: './src/domain', from: './src/application' },
          { target: './src/application', from: './src/infrastructure' },
          { target: './src/ui', from: './src/infrastructure' }
        ]
      }
    ]
  }
};
