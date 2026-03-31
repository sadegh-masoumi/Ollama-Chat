/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        invert: {
          css: {
            '--tw-prose-body': 'rgb(209 213 219)',
            '--tw-prose-headings': 'rgb(243 244 246)',
            '--tw-prose-code': 'rgb(243 244 246)',
            '--tw-prose-pre-bg': 'rgb(17 24 39)',
          },
        },
      },
    },
  },
  plugins: [],
}
