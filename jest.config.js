module.exports = {
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.d.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/'],
  coverageDirectory: '<rootDir>/coverage',
  modulePathIgnorePatterns: ['<rootDir>/lib', '<rootDir>/docs', '<rootDir>/example'],
  coverageThreshold: {
    global: {
      statements: 89,
      branches: 84,
      functions: 89,
      lines: 89,
    },
  },
}
