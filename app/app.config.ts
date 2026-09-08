// app/app.config.ts
//
// THE single place that names which semantic color plays which role in
// Numo. Components must never hardcode a hex value or a raw Tailwind
// color name (e.g. `text-blue-500`) — they reference these semantic
// aliases instead (`color="primary"`, `color="error"`, ...), exactly as
// Nuxt UI's design-token model expects. Changing the brand palette is a
// one-line edit here, never a find-and-replace across components.
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      secondary: 'indigo',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'slate'
    }
  }
})
