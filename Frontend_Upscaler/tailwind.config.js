/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                neo: {
                    bg: '#0F0F10', // Deep dark background
                    card: '#18181B', // Slightly lighter card background
                    accent: '#3B82F6', // Blue accent
                    'accent-hover': '#2563EB',
                }
            },
            boxShadow: {
                'neo-glow': '0 0 20px rgba(59, 130, 246, 0.15)',
                'neo-card': '0 8px 32px rgba(0, 0, 0, 0.4)',
            }
        },
    },
    plugins: [],
}
