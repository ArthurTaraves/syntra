import { Home, LogOut, UserCircle2 } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useRelogio } from '../../hooks/useRelogio'
import { Logo } from '../Logo'

/** Cabeçalho fixo das telas logadas do totem: o botão "Sair" está sempre visível. */
export function TotemLogado() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const agora = useRelogio(15000)

  const encerrar = async () => {
    await sair('totem').catch(() => undefined)
    navigate('/totem', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 bg-marinho-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-8">
          <Link to="/totem/menu" aria-label="Menu inicial" className="shrink-0">
            <Logo tamanho="md" />
          </Link>
          <p className="hidden text-lg text-marinho-100 landscape:md:block">
            {agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} ·{' '}
            {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 text-right sm:flex">
              <UserCircle2 className="size-9 text-destaque-500" aria-hidden />
              <p className="text-lg font-semibold">{usuario?.nome.split(' ')[0]}</p>
            </div>
            <Link to="/totem/menu"
              className="flex min-h-16 items-center gap-2 rounded-2xl bg-marinho-700 px-5 text-xl font-semibold active:bg-marinho-600">
              <Home className="size-7" aria-hidden /> <span className="hidden sm:inline">Início</span>
            </Link>
            <button type="button" onClick={encerrar}
              className="flex min-h-16 items-center gap-2 rounded-2xl bg-destaque-500 px-6 text-xl font-bold text-marinho-950 active:bg-destaque-400">
              <LogOut className="size-7" aria-hidden /> Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
