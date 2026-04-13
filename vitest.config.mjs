import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^\.\/shared\/utils\.mjs$/,
        replacement: path.resolve(import.meta.dirname, 'lambdas/shared/utils.mjs'),
      },
      {
        find: /^\.\/shared\/healthCheck\.mjs$/,
        replacement: path.resolve(import.meta.dirname, 'lambdas/shared/healthCheck.mjs'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    include: [
      'lambdas/**/*.test.mjs',
      'cloudformation/__tests__/**/*.test.{js,mjs}',
      'apps/web/src/**/*.test.ts',
    ],
  },
})
