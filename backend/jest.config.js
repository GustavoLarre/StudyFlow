const base = {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default {
  verbose: true,
  forceExit: true,
  projects: [
    {
      ...base,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
    },
    {
      ...base,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
    },
  ],
};