import { Hand, LayoutDashboard } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { useAuth } from '../../hooks/useAuth'
import { useRelogio } from '../../hooks/useRelogio'
import { primeiraMaiuscula } from '../../lib/texto'
import { modoDemonstracao } from '../../services'

/** Tela de descanso do totem: qualquer toque leva ao login. */
export default function Descanso() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const agora = useRelogio()

  if (usuario) return <Navigate to="/totem/menu" replace />

  const comecar = () => {
    // Em quiosque, tenta entrar em tela cheia (precisa de um gesto do usuário).
    document.documentElement.requestFullscreen?.().catch(() => undefined)
    navigate('/totem/login')
  }

  return (
    <div
      onClick={comecar}
      className="relative flex min-h-dvh cursor-pointer select-none flex-col items-center justify-between bg-gradient-to-b from-marinho-950 via-marinho-900 to-marinho-800 px-6 py-10 text-center text-white"
    >
      <div className="text-xl font-semibold uppercase tracking-[0.2em] text-marinho-100">
        Polícia Rodoviária Federal · Piauí
      </div>

      <div className="flex flex-col items-center gap-6">
        <Logo tamanho="xl" />
        <p className="max-w-3xl text-2xl text-marinho-100 sm:text-3xl">
          Sistema de Navegação, Tecnologia e Recuperação de Arquivos
        </p>
        <p className="rounded-full bg-white/10 px-6 py-2 text-xl font-semibold text-destaque-400">
          PRF-PI · Gestão de Pessoas
        </p>

        <div className="mt-6" aria-live="off">
          <p className="text-7xl font-bold tabular-nums sm:text-8xl">
            {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {/* Data formatada no código (não via CSS capitalize, que capitaliza cada palavra). */}
          <p className="mt-2 text-2xl text-marinho-100">
            {primeiraMaiuscula(agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))}
          </p>
        </div>

        <button type="button"
          onClick={(e) => { e.stopPropagation(); comecar() }}
          className="mt-8 flex min-h-24 items-center gap-4 rounded-3xl bg-destaque-500 px-12 text-3xl font-extrabold text-marinho-950 shadow-2xl motion-safe:animate-respirar active:bg-destaque-400 sm:text-4xl">
          <Hand className="size-10" aria-hidden /> Toque para começar
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 text-base text-marinho-100">
        <p>Consulte a localização de documentos e processos funcionais.</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link to="/privacidade" onClick={(e) => e.stopPropagation()} className="underline underline-offset-4">
            Privacidade e proteção de dados (LGPD)
          </Link>
          {/* Atalho discreto para o painel (exige login de gestor/admin). */}
          <Link to="/admin" onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-marinho-100/80 underline-offset-4 hover:text-white hover:underline">
            <LayoutDashboard className="size-4" aria-hidden /> Acesso do RH (painel)
          </Link>
        </div>
        {modoDemonstracao && (
          <p className="mt-2 rounded-full bg-destaque-500/20 px-4 py-1 text-sm text-destaque-400">
            Modo demonstração · dados fictícios
          </p>
        )}
      </div>
    </div>
  )
}
