import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    preset: 'bun', // build for Bun runtime
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/test-utils',
    '@nuxt/scripts',
    '@pinia/nuxt',
    '@nuxt/fonts',
    '@nuxtjs/color-mode', // ensure <html class="dark"> for Tailwind v4 @variant dark
  ],

  colorMode: {
    classSuffix: '', // -> <html class="dark"> / <html>
    preference: 'dark',
    fallback: 'dark',
  },
  alias: {
    'db': fileURLToPath(new URL('./db', import.meta.url)),
    '@/server': fileURLToPath(new URL('./server', import.meta.url)),
  },

  // Tailwind v4 via Vite plugin (no postcss config needed)
  vite: { plugins: [tailwindcss()] },

  // Point to your Tailwind v4 CSS (rename if you used a different path)
  css: ['~/assets/main.css'],

  // @nuxt/fonts — corrected variable ranges + simpler config
  fonts: {
    provider: 'google',
    families: [
      {
        name: 'Inter',
        // Variable range must be a range string, not two separate numbers
        weights: ['100..900'],
        styles: ['normal', 'italic'],
        global: true,
        // optional: display: 'swap',
      },
      {
        name: 'JetBrains Mono',
        weights: ['100..800'],
        styles: ['normal', 'italic'],
        global: true,
      },
    ],
  },

  ui: {
    // Optional: align Nuxt UI primary with your @theme (blue)
    primary: 'blue',
  },

  runtimeConfig: {
    openrouterApiKey: '',
    openaiApiKey: '',
    jwtSecret: '',
    public: {
      openrouterBase: 'https://openrouter.ai/api/v1',
      openrouterModel: 'deepseek/deepseek-r1:free',
      openaiBase: 'https://api.openai.com/v1',
      openaiModel: 'gpt-5-nano',
      appTitle: 'Nuxt Chat',
      defaultProvider: 'nuxt',
    },
  },
})
