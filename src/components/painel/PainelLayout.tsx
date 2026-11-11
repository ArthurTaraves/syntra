import {
  BarChart3,
  FileText,
  FolderKanban,
  Gauge,
  Hand,
  Inbox,
  UserSearch,
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
import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { TOTEM_AVISO_SEGUNDOS, TOTEM_INATIVIDADE_SEGUNDOS } from '../../config/regrasRH'
import { useAuth } from '../../hooks/useAuth'
import { useInatividade } from '../../hooks/useInatividade'
import { limparPainelPeloTotem, painelAbertoPeloTotem } from '../../lib/sessaoTotem'
import { modoDemonstracao, podeDecidirSolicitacao, restaurarDadosDemonstracao, ROTULO_PERFIL, servicos } from '../../services'
import { Logo } from '../Logo'

// Todo o painel é do RH / Gestão (a rota /admin só aceita esse perfil).
const ITENS: { para: string; rotulo: string; Icone: LucideIcon }[] = [
  { para: '/admin', rotulo: 'Início', Icone: LayoutDashboard },
  { para: '/admin/documentos', rotulo: 'Documentos', Icone: FileText },
  { para: '/admin/indicadores', rotulo: 'Indicadores e alertas', Icone: Gauge },
  { para: '/admin/talentos', rotulo: 'Busca de talentos', Icone: UserSearch },
  { para: '/admin/servidores', rotulo: 'Fichas dos servidores', Icone: Users },
  { para: '/admin/solicitacoes', rotulo: 'Solicitações', Icone: Inbox },
  { para: '/admin/processos', rotulo: 'Processos', Icone: FolderKanban },
  { para: '/admin/relatorios', rotulo: 'Relatórios do acervo', Icone: BarChart3 },
  { para: '/admin/logs', rotulo: 'Logs de acesso', Icone: ScrollText },
  { para: '/admin/usuarios', rotulo: 'Usuários', Icone: UserCog },
]

export function PainelLayout() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const { pathname } = useLocation()
  // Aberto pelo botão "Abrir painel completo" do totem: herda a saída automática de 2 minutos.
  const [peloTotem] = useState(painelAbertoPeloTotem)
  // Quantos pedidos de autoatendimento esperam decisão (atualiza ao trocar de tela).
  const [pendentes, setPendentes] = useState(0)
  useEffect(() => {
    if (!usuario) return
    let ativo = true
    servicos.solicitacoes
      .listar({ status: 'pendente' }, { usuario, origem: 'painel' })
      .then((l) => ativo && setPendentes(l.filter((s) => podeDecidirSolicitacao(usuario, s)).length))
      .catch(() => undefined)
    return () => {
      ativo = false
    }
  }, [usuario, pathname])

  const encerrar = useCallback(async () => {
    await sair('painel').catch(() => undefined)
    limparPainelPeloTotem()
    navigate(peloTotem ? '/totem' : '/admin/login', { replace: true })
  }, [sair, navigate, peloTotem])

  const { restante, reiniciar } = useInatividade({
    ativo: peloTotem && !!usuario,
    limiteSegundos: TOTEM_INATIVIDADE_SEGUNDOS,
    avisoSegundos: TOTEM_AVISO_SEGUNDOS,
    aoExpirar: encerrar,
  })

  if (!usuario) return null

  const restaurar = () => {
    if (!confirm('Restaurar os dados fictícios originais? Alterações feitas nesta demonstração serão perdidas.')) return
    restaurarDadosDemonstracao()
    window.location.assign('/admin/login')
  }

  return (
    <div className="flex min-h-dvh bg-fundo text-marinho-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto bg-marinho-900 text-white transition-transform print:hidden lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/admin"><Logo tamanho="sm" /></Link>
          <button type="button" className="flex size-11 items-center justify-center rounded-lg active:bg-marinho-800 lg:hidden" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">
            <X className="size-6" />
          </button>
        </div>
        <p className="px-5 pb-3 text-xs uppercase tracking-wider text-marinho-100/70">Painel do RH / Gestão · PRF-PI</p>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Menu do painel">
          {ITENS.map(({ para, rotulo, Icone }) => (
            <NavLink key={para} to={para} end={para === '/admin'} onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition pointer-coarse:min-h-13 pointer-coarse:text-base ${
                  isActive ? 'bg-destaque-500 text-marinho-950' : 'text-marinho-50 hover:bg-marinho-800 active:bg-marinho-800'
                }`
              }>
              <Icone className="size-5" aria-hidden /> {rotulo}
              {para === '/admin/solicitacoes' && pendentes > 0 && (
                <span className="ml-auto rounded-full bg-amber-400 px-2 text-xs font-bold text-marinho-950" aria-label={`${pendentes} pendentes`}>{pendentes}</span>
              )}
            </NavLink>
          ))}
          <Link to="/totem/menu" className="mt-4 flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-marinho-100 hover:bg-marinho-800 active:bg-marinho-800 pointer-coarse:min-h-13 pointer-coarse:text-base">
            <MonitorSmartphone className="size-5" aria-hidden /> Voltar ao modo totem
          </Link>
        </nav>
        <div className="border-t border-marinho-800 p-4 text-sm">
          <p className="font-semibold">{usuario.nome}</p>
          <p className="text-marinho-100">{ROTULO_PERFIL[usuario.perfil]} · {usuario.unidade}</p>
          {modoDemonstracao && (
            <button type="button" onClick={restaurar} className="mt-2 flex min-h-11 items-center gap-2 text-xs text-destaque-400 hover:underline">
              <RotateCcw className="size-3.5" /> Restaurar dados da demonstração
            </button>
          )}
          <button type="button" onClick={encerrar}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-marinho-800 font-semibold hover:bg-marinho-700 active:bg-marinho-700 pointer-coarse:min-h-13">
            <LogOut className="size-4" aria-hidden /> Sair
          </button>
        </div>
      </aside>
      {menuAberto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuAberto(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 bg-marinho-900 px-4 py-2 text-white print:hidden lg:hidden">
          <button type="button" onClick={() => setMenuAberto(true)} aria-label="Abrir menu"
            className="flex size-12 items-center justify-center rounded-lg active:bg-marinho-800"><Menu className="size-7" /></button>
          <Logo tamanho="sm" />
        </header>
        {modoDemonstracao && (
          <p className="bg-destaque-100 px-6 py-1.5 text-center text-xs text-marinho-900 print:hidden">
            <strong>Modo demonstração:</strong> dados fictícios armazenados apenas neste navegador.
          </p>
        )}
        <main className="w-full min-w-0 max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {restante !== null && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="aviso-sessao-painel"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-marinho-950/85 p-6 print:hidden">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <p id="aviso-sessao-painel" className="text-2xl font-bold text-marinho-900">Sua sessão vai encerrar…</p>
            <p className="my-5 text-7xl font-extrabold tabular-nums text-marinho-800" aria-live="assertive">{restante}</p>
            <p className="mb-6 text-marinho-700">
              Painel aberto pelo totem: por segurança, a sessão encerra após {TOTEM_INATIVIDADE_SEGUNDOS / 60} minutos sem uso.
            </p>
            <button type="button" onClick={reiniciar}
              className="flex min-h-16 w-full items-center justify-center gap-3 rounded-xl bg-destaque-500 text-xl font-bold text-marinho-950 active:bg-destaque-400">
              <Hand className="size-7" aria-hidden /> Continuar usando
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
