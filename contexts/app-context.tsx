import React, { createContext, useContext, useReducer, useEffect } from "react"

// Types
export interface AppState {
  theme: "light" | "dark"
  isGenerating: boolean
  progress: number
  reducedMotion: boolean
  highContrast: boolean
  fontSize: "sm" | "md" | "lg"
}

type AppAction =
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_PROGRESS"; payload: number }
  | { type: "SET_REDUCED_MOTION"; payload: boolean }
  | { type: "SET_HIGH_CONTRAST"; payload: boolean }
  | { type: "SET_FONT_SIZE"; payload: "sm" | "md" | "lg" }
  | { type: "RESET_PROGRESS" }

// Initial state
const initialState: AppState = {
  theme: "light",
  isGenerating: false,
  progress: 0,
  reducedMotion: false,
  highContrast: false,
  fontSize: "md"
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.payload }
    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload }
    case "SET_PROGRESS":
      return { ...state, progress: action.payload }
    case "SET_REDUCED_MOTION":
      return { ...state, reducedMotion: action.payload }
    case "SET_HIGH_CONTRAST":
      return { ...state, highContrast: action.payload }
    case "SET_FONT_SIZE":
      return { ...state, fontSize: action.payload }
    case "RESET_PROGRESS":
      return { ...state, progress: 0 }
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Initialize from localStorage and system preferences
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const theme = savedTheme || systemTheme
    dispatch({ type: "SET_THEME", payload: theme })

    // Accessibility preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    dispatch({ type: "SET_REDUCED_MOTION", payload: prefersReducedMotion })

    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)").matches
    dispatch({ type: "SET_HIGH_CONTRAST", payload: prefersHighContrast })

    // Font size preference
    const savedFontSize = localStorage.getItem("fontSize") as "sm" | "md" | "lg" | null
    if (savedFontSize) {
      dispatch({ type: "SET_FONT_SIZE", payload: savedFontSize })
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark")
    localStorage.setItem("theme", state.theme)
  }, [state.theme])

  // Apply font size to document
  useEffect(() => {
    document.documentElement.classList.remove("text-sm", "text-base", "text-lg")
    const fontClass = state.fontSize === "sm" ? "text-sm" : state.fontSize === "lg" ? "text-lg" : "text-base"
    document.documentElement.classList.add(fontClass)
    localStorage.setItem("fontSize", state.fontSize)
  }, [state.fontSize])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

// Helper hooks
export function useTheme() {
  const { state, dispatch } = useApp()
  
  const toggleTheme = () => {
    const newTheme = state.theme === "light" ? "dark" : "light"
    dispatch({ type: "SET_THEME", payload: newTheme })
  }

  return {
    theme: state.theme,
    toggleTheme
  }
}

export function useProgress() {
  const { state, dispatch } = useApp()
  
  const setProgress = (progressOrUpdater: number | ((prev: number) => number)) => {
    if (typeof progressOrUpdater === 'function') {
      const newProgress = progressOrUpdater(state.progress)
      dispatch({ type: "SET_PROGRESS", payload: Math.max(0, Math.min(100, newProgress)) })
    } else {
      dispatch({ type: "SET_PROGRESS", payload: Math.max(0, Math.min(100, progressOrUpdater)) })
    }
  }
  
  const resetProgress = () => {
    dispatch({ type: "RESET_PROGRESS" })
  }

  return {
    progress: state.progress,
    setProgress,
    resetProgress
  }
}

export function useAccessibility() {
  const { state, dispatch } = useApp()
  
  const setReducedMotion = (enabled: boolean) => {
    dispatch({ type: "SET_REDUCED_MOTION", payload: enabled })
  }
  
  const setHighContrast = (enabled: boolean) => {
    dispatch({ type: "SET_HIGH_CONTRAST", payload: enabled })
  }
  
  const setFontSize = (size: "sm" | "md" | "lg") => {
    dispatch({ type: "SET_FONT_SIZE", payload: size })
  }

  return {
    reducedMotion: state.reducedMotion,
    highContrast: state.highContrast,
    fontSize: state.fontSize,
    setReducedMotion,
    setHighContrast,
    setFontSize
  }
}