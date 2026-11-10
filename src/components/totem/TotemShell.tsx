import { Hand } from 'lucide-react'
import { useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useInatividade } from '../../hooks/useInatividade'

export const LIMITE_INATIVIDADE_S = 60
export const AVISO_INATIVIDADE_S = 10

/**
 * Envolve todas as telas do totem. Após 60 s sem interação encerra a sessão e volta à
 * tela de descanso; nos últimos 10 s mostra a contagem regressiva.
 */
export function TotemShell() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const naTelaDescanso = pathname === '/totem' || pathname === '/totem/'

  const expirar = useCallback(async () => {
    if (usuario) await sair('totem').catch(() => undefined)
    navigate('/totem', { replace: true })
  }, [usuario, sair, navigate])

  const { restante, reiniciar } = useInatividade({
    ativo: !naTelaDescanso,
    limiteSegundos: LIMITE_INATIVIDADE_S,
    avisoSegundos: AVISO_INATIVIDADE_S,
    aoExpirar: expirar,
  })

  return (
    <div className="totem min-h-dvh bg-fundo text-xl text-marinho-950">
      <Outlet />
      {restante !== null && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="aviso-sessao"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-marinho-950/85 p-6">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl">
            <p id="aviso-sessao" className="text-3xl font-bold text-marinho-900">
              {usuario ? 'Sua sessão vai encerrar…' : 'Voltando à tela inicial…'}
            </p>
            <p className="my-6 text-8xl font-extrabold tabular-nums text-marinho-800" aria-live="assertive">
              {restante}
            </p>
            <p className="mb-8 text-xl text-marinho-700">Por segurança, o totem encerra a sessão após 1 minuto sem uso.</p>
            <button type="button" onClick={reiniciar}
              className="flex min-h-20 w-full items-center justify-center gap-3 rounded-2xl bg-destaque-500 text-2xl font-bold text-marinho-950 active:bg-destaque-400">
              <Hand className="size-8" aria-hidden /> Continuar usando
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
