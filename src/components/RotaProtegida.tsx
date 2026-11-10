import { ShieldX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Perfil } from '../types'
import { Carregando } from './Estados'

interface Props {
  children: ReactNode
  /** Perfis permitidos. Se omitido, basta estar logado. */
  perfis?: Perfil[]
  /** Para onde mandar quem não está logado. */
  login: string
}

export function RotaProtegida({ children, perfis, login }: Props) {
  const { usuario, carregando } = useAuth()
  const local = useLocation()

  if (carregando) return <Carregando texto="Verificando sessão…" />
  if (!usuario) return <Navigate to={login} replace state={{ de: local.pathname }} />
  if (perfis && !perfis.includes(usuario.perfil)) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 p-10 text-center">
        <ShieldX className="size-14 text-red-700" aria-hidden />
        <h1 className="text-2xl font-bold text-marinho-900">Acesso não permitido</h1>
        <p className="text-marinho-700">Seu perfil não tem permissão para acessar esta área.</p>
        <Link to="/totem" className="rounded-lg bg-marinho-800 px-5 py-3 font-semibold text-white hover:bg-marinho-700">
          Ir para o totem
        </Link>
      </div>
    )
  }
  return <>{children}</>
}
