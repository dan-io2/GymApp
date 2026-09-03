const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['.expo/**', 'coverage/**', 'dist/**', 'web-build/**'],
  },
];
