import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      jsc: {
        parser: {
          syntax: "typescript",
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
    environment: "node",
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
    setupFiles: ["test/vitest-setup.ts"],
    coverage: {
      include: ["src/**/*.{ts,js}"],
      reporter: ["text", "json", "html"],
      reportsDirectory: "../../coverage/worker", // Changed path for consistency with api and to separate reports
    },
  },
});
