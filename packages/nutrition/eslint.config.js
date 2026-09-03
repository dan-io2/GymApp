const expoConfig = require('../../apps/mobile/eslint.config.js');

module.exports = [
  ...expoConfig,
  {
    files: ['src/**/*.ts'],
    settings: {
      react: {
        version: '19.2',
      },
    },
  },
];
