import { Briefcase, ClipboardCheck, Eye, FolderOpen, IdCard, Inbox, LayoutDashboard, Printer, Upload, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { marcarPainelPeloTotem } from '../../lib/sessaoTotem'
import { ehGestao, podeDecidirSolicitacao, servicos } from '../../services'

interface Opcao {
  para: string
  titulo: string
  descricao: string
  Icone: LucideIcon
}

/** Opções da própria ficha: as mesmas para os dois níveis (cada um consulta a PRÓPRIA ficha). */
const OPCOES_POLICIAL: Opcao[] = [
  { para: '/totem/minha-ficha', titulo: 'Minha ficha', descricao: 'Seus dados, lotação, aposentadoria, cursos e talentos.', Icone: IdCard },
  { para: '/totem/meus-documentos', titulo: 'Meus documentos e processos', descricao: 'Onde estão guardados e em que pé estão.', Icone: FolderOpen },
  { para: '/totem/minha-ficha/enviar', titulo: 'Enviar curso ou documento', descricao: 'Atualize sua ficha; o RH / Gestão aprova.', Icone: Upload },
  { para: '/totem/solicitacoes', titulo: 'Minhas solicitações', descricao: 'Acompanhe o que você enviou: pendente, aprovado ou recusado.', Icone: Inbox },
  { para: '/totem/extrato', titulo: 'Imprimir extrato da ficha', descricao: 'Escolha as seções e imprima, com código de verificação.', Icone: Printer },
]

/** Opções do RH / Gestão, na ordem de prioridade (todas as unidades). */
const OPCOES_GESTAO: Opcao[] = [
  { para: '/totem/pedidos', titulo: 'Pedidos para aprovar', descricao: 'Cursos e documentos enviados pelos servidores.', Icone: ClipboardCheck },
  { para: '/totem/fichas', titulo: 'Fichas dos servidores', descricao: 'Busque por matrícula ou nome, em todas as unidades.', Icone: Users },
  { para: '/admin', titulo: 'Abrir painel completo', descricao: 'Indicadores, alertas, talentos, relatórios e mais.', Icone: LayoutDashboard },
]

const textoPendentes = (n: number) =>
  n === 0 ? 'Nenhum pedido pendente' : n === 1 ? '1 pedido aguardando sua análise' : `${n} pedidos aguardando sua análise`

/** Card grande (menu do Policial e opções de gestão). */
function Cartao({ opcao: { para, titulo, descricao, Icone }, aoAbrir, extra }: { opcao: Opcao; aoAbrir?: () => void; extra?: ReactNode }) {
  return (
    <Link to={para} onClick={aoAbrir}
      className="flex min-h-40 items-center gap-6 rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100 transition active:scale-[0.98] active:ring-4 active:ring-destaque-500 sm:p-8">
      <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-marinho-900 text-destaque-500">
        <Icone className="size-14" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-3xl font-bold text-marinho-950">{titulo}</span>
        <span className="mt-1 block text-xl text-marinho-700">{descricao}</span>
        {extra}
      </span>
    </Link>
  )
}

/** Card compacto: "Minha ficha pessoal" do RH / Gestão (cabe sem muita rolagem no totem vertical). */
function CartaoCompacto({ opcao: { para, titulo, Icone } }: { opcao: Opcao }) {
  return (
    <Link to={para}
      className="flex min-h-20 items-center gap-4 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-marinho-100 transition active:scale-[0.98] active:ring-4 active:ring-destaque-500">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-marinho-900 text-destaque-500">
        <Icone className="size-8" aria-hidden />
      </span>
      <span className="text-2xl font-bold text-marinho-950">{titulo}</span>
    </Link>
  )
}

/** Contador grande do card "Pedidos para aprovar" (número + texto, nunca só a cor). */
function ContadorPedidos({ n }: { n: number | null }) {
  if (n === null) return <span className="mt-3 block text-xl text-marinho-600">Contando pedidos…</span>
  return (
    <span className={`mt-3 inline-flex items-center gap-3 rounded-2xl px-4 py-2 ring-2 ${n > 0 ? 'bg-amber-100 text-amber-950 ring-amber-400' : 'bg-emerald-50 text-emerald-950 ring-emerald-300'}`}>
      <span className="text-5xl font-extrabold tabular-nums leading-none">{n}</span>
      <span className="text-xl font-semibold leading-tight">{n === 1 ? 'pedido aguardando' : n === 0 ? 'nenhum pendente' : 'pedidos aguardando'}</span>
    </span>
  )
}

export default function MenuTotem() {
  const { usuario } = useAuth()
  const gestao = ehGestao(usuario)

  // Pedidos que este usuário pode decidir (nunca os próprios). null = ainda carregando.
  const [pendentes, setPendentes] = useState<number | null>(null)
  useEffect(() => {
    if (!usuario || !ehGestao(usuario)) return
    let ativo = true
    servicos.solicitacoes
      .listar({ status: 'pendente' }, { usuario, origem: 'totem' })
      .then((l) => ativo && setPendentes(l.filter((s) => podeDecidirSolicitacao(usuario, s)).length))
      .catch(() => ativo && setPendentes(0))
    return () => {
      ativo = false
    }
  }, [usuario])

  if (!usuario) return null
  const nome = usuario.nome.split(' ')[0]

  // ---------- Policial: menu inalterado ----------
  if (!gestao)
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-marinho-900 sm:text-5xl">Olá, {nome}!</h1>
          <p className="mt-3 inline-flex items-center gap-3 rounded-2xl bg-marinho-900 px-5 py-3 text-xl font-semibold text-white">
            <Eye className="size-6 shrink-0 text-destaque-500" aria-hidden /> Aqui você consulta a sua ficha
          </p>
          <p className="mt-3 text-2xl text-marinho-700">O que você deseja fazer?</p>
        </div>
        <nav className="grid grid-cols-1 gap-6 landscape:md:grid-cols-2" aria-label="Minha ficha">
          {OPCOES_POLICIAL.map((o) => <Cartao key={o.para} opcao={o} />)}
        </nav>
      </div>
    )

  // ---------- RH / Gestão: gestão em destaque, ficha pessoal compacta abaixo ----------
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-extrabold text-marinho-900 sm:text-5xl">Olá, {nome}!</h1>
        <p className="mt-3 inline-flex items-center gap-3 rounded-2xl bg-marinho-900 px-5 py-3 text-xl font-semibold text-white" aria-live="polite">
          <Briefcase className="size-6 shrink-0 text-destaque-500" aria-hidden />
          Painel de gestão · {pendentes === null ? 'contando pedidos…' : textoPendentes(pendentes)}
        </p>
      </div>

      <section aria-labelledby="titulo-gestao" className="rounded-3xl border-4 border-destaque-500 bg-destaque-100 p-4 sm:p-6">
        <h2 id="titulo-gestao" className="mb-4 flex items-center gap-3 text-3xl font-extrabold text-marinho-900">
          <Briefcase className="size-8 text-marinho-800" aria-hidden /> Gestão de pessoas
        </h2>
        <nav className="grid grid-cols-1 gap-4 landscape:md:grid-cols-3" aria-label="Gestão de pessoas">
          {OPCOES_GESTAO.map((o) => (
            <Cartao key={o.para} opcao={o}
              extra={o.para === '/totem/pedidos' ? <ContadorPedidos n={pendentes} /> : undefined}
              // O painel aberto daqui herda a saída automática de 2 minutos do totem.
              aoAbrir={o.para === '/admin' ? marcarPainelPeloTotem : undefined} />
          ))}
        </nav>
      </section>

      <section aria-labelledby="titulo-ficha-pessoal">
        <h2 id="titulo-ficha-pessoal" className="mb-3 text-2xl font-extrabold text-marinho-900">Minha ficha pessoal</h2>
        <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2 landscape:md:grid-cols-3" aria-label="Minha ficha pessoal">
          {OPCOES_POLICIAL.map((o) => <CartaoCompacto key={o.para} opcao={o} />)}
        </nav>
      </section>
    </div>
  )
}
