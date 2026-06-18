/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      translate: {
        '4.5': '1.125rem', // 18px (translates w-2.5 dot to the right edge of a w-8 container with equal 4px margin)
      },
    },
  },
  plugins: [],
}
