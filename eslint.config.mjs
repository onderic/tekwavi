// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  [
    {
      ignores: ['node_modules/', 'dist/', '.output/', 'public/', '.nuxt/'],
    },
    {
      files: ['*.vue'],
      rules: {
        'vue/multi-word-component-names': 'error',
      },
    },
    {
      // Global rules for all files
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['app.vue', 'error.vue', 'pages/**/*.vue', 'layouts/**/*.vue'],
      rules: {
      // disable the rule for these files
        'vue/multi-word-component-names': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'vue/singleline-html-element-content-newline': 'off',
      },
    },
  ],
)
