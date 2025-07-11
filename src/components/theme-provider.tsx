import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [loading, setLoading] = useState<boolean>(true)

  // Load theme from local JSON store on mount
  useEffect(() => {
    const load = async () => {
      try {
        type Pref = { id: number; theme: Theme }
        const pref = await window.api.db.getById<Pref>('preferences', 1)
        if (pref && pref.theme) {
          setThemeState(pref.theme)
        } else {
          await window.api.db.create('preferences', { id: 1, theme: defaultTheme })
          setThemeState(defaultTheme)
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [defaultTheme])

  // Apply theme class to document
  useEffect(() => {
    if (loading) return
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    const applied =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme
    root.classList.add(applied)
  }, [theme, loading])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    type Pref = { id: number; theme: Theme }
    const pref = await window.api.db.getById<Pref>('preferences', 1)
    if (pref) {
      await window.api.db.update('preferences', 1, { theme: newTheme })
    } else {
      await window.api.db.create('preferences', { id: 1, theme: newTheme })
    }
  }
  const value = { theme, setTheme, loading }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}