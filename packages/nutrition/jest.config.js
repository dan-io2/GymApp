module.exports = {
  displayName: '@gymapp/nutrition',
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'babel-jest',
      {
        plugins: ['@babel/plugin-transform-modules-commonjs'],
        presets: ['@babel/preset-typescript'],
      },
    ],
  },
};
