import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

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
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    const body = window.document.body

    console.log('🎨 Theme changing to:', theme)
    console.log('🔍 Root classes before:', root.classList.toString())
    console.log('🔍 Body classes before:', body.classList.toString())
    
    // Remove from both root and body
    root.classList.remove("light", "dark")
    body.classList.remove("light", "dark")
    
    // Add to both root and body to ensure coverage
    root.classList.add(theme)
    body.classList.add(theme)
    
    console.log('✅ Root classes after:', root.classList.toString())
    console.log('✅ Body classes after:', body.classList.toString())
    
    // Force a style recalculation
    window.getComputedStyle(root).getPropertyValue('--background')
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
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
