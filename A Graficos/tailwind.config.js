/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },

      colors: {
        // ─── Surfaces ────────────────────────────────────────────────────
        surface: {
          base:    '#0C0D10', // fondo raíz — casi negro con tinte zinc
          raised:  '#13151A', // cards de primer nivel
          overlay: '#1A1D24', // cards de segundo nivel / modales
          border:  '#2A2D35', // bordes sutiles
          hover:   '#1F2229', // hover states
        },

        // ─── Acento principal — Amber/Gold (reemplaza el azul genérico) ──
        // Transmite: energía, liderazgo, premium
        amber: {
          50:  '#FFFBF0',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24', // ← uso principal: botones, highlights, streaks
          500: '#F59E0B',
          600: '#D97706', // ← bordes activos, badges
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },

        // ─── Acento secundario — Emerald (salud, hábitos, progreso) ──────
        emerald: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399', // ← checkmarks, racha, completado
          500: '#10B981',
          600: '#059669', // ← textos sobre fondo emerald
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },

        // ─── Acento terciario — Violet (mentalidad, visión, manifesto) ───
        violet: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA', // ← Manifiesto, Visión Mensual
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },

        // ─── Coral — alertas, foco, urgencia ────────────────────────────
        coral: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },

        // ─── Zinc — texto y escala de grises refinados ──────────────────
        zinc: {
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
        },
      },

      // ─── Espaciado premium ─────────────────────────────────────────────
      spacing: {
        4.5: '1.125rem',
        13:  '3.25rem',
        18:  '4.5rem',
      },

      // ─── Radios consistentes ──────────────────────────────────────────
      borderRadius: {
        sm:   '6px',
        DEFAULT: '8px',
        md:   '10px',
        lg:   '14px',
        xl:   '18px',
        '2xl':'24px',
      },

      // ─── Tipografía — escala de 8 niveles ─────────────────────────────
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:    ['12px', { lineHeight: '16px' }],
        sm:    ['13px', { lineHeight: '18px' }],
        base:  ['14px', { lineHeight: '20px' }],
        md:    ['15px', { lineHeight: '22px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['18px', { lineHeight: '26px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['28px', { lineHeight: '36px' }],
        '5xl': ['32px', { lineHeight: '40px' }],
      },

      // ─── Transiciones ─────────────────────────────────────────────────
      transitionDuration: {
        fast:   '120ms',
        normal: '200ms',
        slow:   '350ms',
      },

      // ─── Sombras — muy sutiles para dark mode ─────────────────────────
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        glow:   '0 0 20px rgba(251,191,36,0.15)',  // amber glow sutil
        focus:  '0 0 0 3px rgba(251,191,36,0.25)', // focus ring amber
      },
    },
  },
  plugins: [],
}
