module.exports = {
  preset: "@shelf/jest-mongodb",
  testTimeout: 30000,
  watchPathIgnorePatterns: ["<rootDir>/globalConfig.json"],
  setupFiles: ["<rootDir>/.jest/setEnvVars.js"],
};
