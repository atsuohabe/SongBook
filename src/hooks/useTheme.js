import { useState, useEffect, useCallback } from 'react'

const THEME_KEY = 'songbook-theme'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_KEY, newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme }
}
