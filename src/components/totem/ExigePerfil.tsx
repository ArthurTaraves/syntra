import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { Perfil } from '../../types'

/**
 * Bloqueia uma tela do totem para perfis não permitidos, redirecionando ao menu.
 * (A proteção real dos dados continua na camada de serviços e no firestore.rules.)
 */
export function ExigePerfil({ perfis, children }: { perfis: Perfil[]; children: ReactNode }) {
  const { usuario } = useAuth()
  if (!usuario || !perfis.includes(usuario.perfil)) return <Navigate to="/totem/menu" replace />
  return <>{children}</>
}
