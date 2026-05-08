import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    // This is required to support NestJS decorators and metadata
    // @ts-ignore - swc.vite() returns a plugin that is type-incompatible with this version of vitest but works at runtime
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  test: {
    globals: true, // Enables global APIs like describe, it, expect, vi
    environment: 'node', // Node.js environment is suitable for NestJS backend tests
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'], // Adjust if your test file naming convention differs
    setupFiles: ['test/vitest-setup.ts'],
    coverage: {
      include: ['src/**/*.{ts,js}'], // Include all source files for coverage
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../../coverage/api', // Changed path to avoid conflict and ensure app-specific coverage under root coverage folder
    },
  },
});
