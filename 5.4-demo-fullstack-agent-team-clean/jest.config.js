/**
 * Two projects, because the two halves of the app need different environments:
 *
 *   api      -> testEnvironment 'node',  *.test.ts  under tests/api
 *   frontend -> testEnvironment 'jsdom', *.test.tsx under tests/frontend
 *
 * ts-jest reads tsconfig.json for compilerOptions, but that file is owned by
 * the build (rootDir: ./src, include: ["src"], lib without DOM). Tests live
 * outside src and need DOM lib types, so each project layers the overrides it
 * needs on top via ts-jest's inline `tsconfig` object. tsconfig.json itself is
 * never touched.
 */

/** Compiler overrides both projects need: tests live outside `src`. */
const baseCompilerOptions = {
  rootDir: '.',
  declaration: false,
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: ['<rootDir>/tests/api/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { ...baseCompilerOptions } }],
      },
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/tests'],
      testMatch: [
        '<rootDir>/tests/frontend/**/*.test.tsx',
        '<rootDir>/tests/frontend/**/*.test.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: {
              ...baseCompilerOptions,
              jsx: 'react-jsx',
              lib: ['ES2020', 'DOM', 'DOM.Iterable'],
              // ts-jest compiles each file on its own, so the setup file's
              // `import '@testing-library/jest-dom'` does not reach the test
              // files' type space. Pulling the types in here does.
              types: ['jest', 'node', '@testing-library/jest-dom'],
            },
          },
        ],
      },
    },
  ],
};
