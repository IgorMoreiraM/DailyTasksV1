/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    safelist: [
        'bg-brand-teal',
        'bg-brand-teal-dark',
        'bg-brand-teal-mid',
        'bg-brand-teal-subtle',
        'bg-brand-orange',
        'bg-brand-orange-dark',
        'bg-brand-orange-subtle',
        'text-brand-teal',
        'text-brand-orange',
        'hover:bg-brand-teal-dark',
        'border-brand-teal',
        'border-brand-teal-mid',
        'shadow-brand-teal/20',
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Sora', 'sans-serif'],
                sans: ['DM Sans', 'sans-serif'],
            },
            colors: {
                brand: {
                    teal: '#2a7a8a',
                    'teal-dark': '#1d5f6d',
                    'teal-mid': '#3d9aac',
                    'teal-light': '#d0edf2',
                    'teal-subtle': '#e8f5f7',
                    orange: '#f97316',
                    'orange-dark': '#ea6c0a',
                    'orange-mid': '#fb923c',
                    'orange-light': '#ffe8d6',
                    'orange-subtle': '#fff4ed',
                },
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease both',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
                'scale-in': 'scaleIn 0.25s cubic-bezier(0.22,1,0.36,1) both',
            },
            keyframes: {
                fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
                slideUp: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
                scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
            },
        },
    },
    plugins: [],
}