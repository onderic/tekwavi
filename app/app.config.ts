export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'gray',
      secondary: 'orange',
      success: 'green',
      tertiary: 'purple',
    },
    input: {
      slots: {
        root: 'w-full',
      },
    },
    select: {
      slots: {
        base: 'w-full',
      },
    },

  },
})
