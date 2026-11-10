import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { servicos, type Contexto } from '../services'
import type { Origem, Usuario } from '../types'

interface ValorAuth {
  usuario: Usuario | null
  carregando: boolean
  entrar: (matricula: string, senha: string, origem: Origem) => Promise<Usuario>
  sair: (origem: Origem) => Promise<void>
}

const AuthContext = createContext<ValorAuth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(
    () =>
      servicos.auth.observar((u) => {
        setUsuario(u)
        setCarregando(false)
      }),
    [],
  )

  const entrar = useCallback(async (matricula: string, senha: string, origem: Origem) => {
    const u = await servicos.auth.entrar(matricula, senha, origem)
    setUsuario(u)
    return u
  }, [])

  const sair = useCallback(
    async (origem: Origem) => {
      await servicos.auth.sair(usuario ? { usuario, origem } : null)
      setUsuario(null)
    },
    [usuario],
  )

  const valor = useMemo(() => ({ usuario, carregando, entrar, sair }), [usuario, carregando, entrar, sair])
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

/** Contexto de acesso para os serviços. Use apenas em rotas protegidas (usuário garantido). */
export function useContextoAcesso(origem: Origem): Contexto {
  const { usuario } = useAuth()
  if (!usuario) throw new Error('useContextoAcesso usado fora de rota protegida')
  return useMemo(() => ({ usuario, origem }), [usuario, origem])
}
