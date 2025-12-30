import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 180000, // 3 minutes for integration tests with slow API
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/**', '**/*.d.ts', '**/*.config.*', '**/index.ts'],
    },
  },
});
