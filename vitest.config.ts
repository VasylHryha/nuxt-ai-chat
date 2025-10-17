import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    setupFiles: ['tests/setup/test-env.ts'],
    globals: true,
    environmentOptions: {
      nuxt: {
        rootDir: '.',
        domEnvironment: 'happy-dom',
        dotenv: {
          files: ['.env.test'],
        },
      },
    },
  },
})
