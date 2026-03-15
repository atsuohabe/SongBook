import { createContext, useContext } from 'react'
import { useSpotify } from '../hooks/useSpotify'

const SpotifyContext = createContext(null)

export function SpotifyProvider({ children }) {
  const spotify = useSpotify()
  return (
    <SpotifyContext.Provider value={spotify}>
      {children}
    </SpotifyContext.Provider>
  )
}

export function useSpotifyContext() {
  return useContext(SpotifyContext)
}
