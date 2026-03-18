import { createContext, useContext, useState, useEffect } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('ll_token')
    const u = localStorage.getItem('ll_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setLoading(false)
  }, [])

  const login = (tok, usr) => {
    setToken(tok); setUser(usr)
    localStorage.setItem('ll_token', tok)
    localStorage.setItem('ll_user', JSON.stringify(usr))
  }

  const logout = () => {
    setToken(null); setUser(null)
    localStorage.removeItem('ll_token')
    localStorage.removeItem('ll_user')
  }

  return <AuthCtx.Provider value={{ user, token, login, logout, loading }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
