export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['<rootDir>/tests/**/*.test.js'], // <- Adicionamos o <rootDir> aqui
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};