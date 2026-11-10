import {
  BarChart3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorSmartphone,
  RotateCcw,
  ScrollText,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { modoDemonstracao, restaurarDadosDemonstracao, ROTULO_PERFIL } from '../../services'
import type { Perfil } from '../../types'
import { Logo } from '../Logo'

const ITENS: { para: string; rotulo: string; Icone: LucideIcon; perfis: Perfil[] }[] = [
  { para: '/admin', rotulo: 'Início', Icone: LayoutDashboard, perfis: ['gestor', 'admin'] },
  { para: '/admin/documentos', rotulo: 'Documentos', Icone: FileText, perfis: ['gestor', 'admin'] },
  { para: '/admin/servidores', rotulo: 'Servidores', Icone: Users, perfis: ['gestor', 'admin'] },
  { para: '/admin/processos', rotulo: 'Processos', Icone: FolderKanban, perfis: ['gestor', 'admin'] },
  { para: '/admin/relatorios', rotulo: 'Relatórios', Icone: BarChart3, perfis: ['gestor', 'admin'] },
  { para: '/admin/logs', rotulo: 'Logs de acesso', Icone: ScrollText, perfis: ['admin'] },
  { para: '/admin/usuarios', rotulo: 'Usuários', Icone: UserCog, perfis: ['admin'] },
]

export function PainelLayout() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  if (!usuario) return null

  const encerrar = async () => {
    await sair('painel').catch(() => undefined)
    navigate('/admin/login', { replace: true })
  }

  const restaurar = () => {
    if (!confirm('Restaurar os dados fictícios originais? Alterações feitas nesta demonstração serão perdidas.')) return
    restaurarDadosDemonstracao()
    window.location.assign('/admin/login')
  }

  return (
    <div className="flex min-h-dvh bg-fundo text-marinho-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-marinho-900 text-white transition-transform print:hidden lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/admin"><Logo tamanho="sm" /></Link>
          <button type="button" className="rounded p-1 lg:hidden" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">
            <X className="size-5" />
          </button>
        </div>
        <p className="px-5 pb-3 text-xs uppercase tracking-wider text-marinho-100/70">Painel do RH · PRF-PI</p>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Menu do painel">
          {ITENS.filter((i) => i.perfis.includes(usuario.perfil)).map(({ para, rotulo, Icone }) => (
            <NavLink key={para} to={para} end={para === '/admin'} onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-destaque-500 text-marinho-950' : 'text-marinho-50 hover:bg-marinho-800'
                }`
              }>
              <Icone className="size-5" aria-hidden /> {rotulo}
            </NavLink>
          ))}
          <Link to="/totem" className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-marinho-100 hover:bg-marinho-800">
            <MonitorSmartphone className="size-5" aria-hidden /> Abrir modo totem
          </Link>
        </nav>
        <div className="border-t border-marinho-800 p-4 text-sm">
          <p className="font-semibold">{usuario.nome}</p>
          <p className="text-marinho-100">{ROTULO_PERFIL[usuario.perfil]} · {usuario.unidade}</p>
          {modoDemonstracao && (
            <button type="button" onClick={restaurar} className="mt-3 flex items-center gap-2 text-xs text-destaque-400 hover:underline">
              <RotateCcw className="size-3.5" /> Restaurar dados da demonstração
            </button>
          )}
          <button type="button" onClick={encerrar}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-marinho-800 py-2 font-semibold hover:bg-marinho-700">
            <LogOut className="size-4" aria-hidden /> Sair
          </button>
        </div>
      </aside>
      {menuAberto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuAberto(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 bg-marinho-900 px-4 py-3 text-white print:hidden lg:hidden">
          <button type="button" onClick={() => setMenuAberto(true)} aria-label="Abrir menu"><Menu className="size-6" /></button>
          <Logo tamanho="sm" />
        </header>
        {modoDemonstracao && (
          <p className="bg-destaque-100 px-6 py-1.5 text-center text-xs text-marinho-900 print:hidden">
            <strong>Modo demonstração:</strong> dados fictícios armazenados apenas neste navegador.
          </p>
        )}
        <main className="w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
