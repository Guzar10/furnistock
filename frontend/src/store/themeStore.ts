import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('light', next === 'light')
      },
    }),
    { name: 'furnistock-theme' }
  )
)

// Aplică tema salvată la încărcarea paginii
export const initTheme = () => {
  const stored = localStorage.getItem('furnistock-theme')
  if (stored) {
    const { state } = JSON.parse(stored)
    if (state?.theme === 'light') {
      document.documentElement.classList.add('light')
    }
  }
}