const path = require('path');
module.exports = {
  rootDir: path.join(__dirname, '..'),
  preset: null,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/dist/tests/**/*.test.js'],
  modulePathIgnorePatterns: [],
  verbose: true,
  forceExit: true
};
