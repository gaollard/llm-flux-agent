/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#f5f6f8',
          1: '#ffffff',
          2: '#eef0f4',
          3: '#e4e7ec'
        }
      }
    }
  },
  plugins: []
}
