/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1115',
        glow: '#f6c177',
        ocean: '#0b1d3a',
        solar: '#f7f6ed',
        ember: '#ff4d2e',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.6' },
          '100%': { transform: 'scale(1.25)', opacity: '0' },
        },
        drift: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(16px, -10px, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        sweep: 'sweep 7s linear infinite',
        pulseRing: 'pulseRing 2.8s ease-out infinite',
        drift: 'drift 10s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
