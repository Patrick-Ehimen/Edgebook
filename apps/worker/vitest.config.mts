import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
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
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    setupFiles: ['test/vitest-setup.ts'],
    coverage: {
      include: ['src/**/*.{ts,js}'],
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../../coverage/worker', // Changed path for consistency with api and to separate reports
    },
  },
});
