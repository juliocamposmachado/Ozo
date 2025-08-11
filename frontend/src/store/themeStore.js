import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light', // 'light' ou 'dark'

      // Alternar tema
      toggleTheme: () => {
        set(state => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        }));
      },

      // Definir tema específico
      setTheme: (theme) => {
        if (theme === 'light' || theme === 'dark') {
          set({ theme });
        }
      },

      // Detectar preferência do sistema
      detectSystemTheme: () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        set({ theme: prefersDark ? 'dark' : 'light' });
      }
    }),
    {
      name: 'theme-storage'
    }
  )
);
