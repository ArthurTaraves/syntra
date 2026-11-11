import { ClipboardCheck, Eye, FolderOpen, IdCard, Inbox, LayoutDashboard, Printer, ShieldCheck, Upload, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
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

/** Menu do Policial: igual para todos os perfis (cada um consulta a PRÓPRIA ficha). */
const OPCOES_POLICIAL: Opcao[] = [
  { para: '/totem/minha-ficha', titulo: 'Minha ficha', descricao: 'Seus dados, lotação, aposentadoria, cursos e talentos.', Icone: IdCard },
  { para: '/totem/meus-documentos', titulo: 'Meus documentos e processos', descricao: 'Onde estão guardados e em que pé estão.', Icone: FolderOpen },
  { para: '/totem/minha-ficha/enviar', titulo: 'Enviar curso ou documento', descricao: 'Atualize sua ficha; o RH / Gestão aprova.', Icone: Upload },
  { para: '/totem/solicitacoes', titulo: 'Minhas solicitações', descricao: 'Acompanhe o que você enviou: pendente, aprovado ou recusado.', Icone: Inbox },
  { para: '/totem/extrato', titulo: 'Imprimir extrato da ficha', descricao: 'Escolha as seções e imprima, com código de verificação.', Icone: Printer },
]

/** Opções a mais do RH / Gestão (todas as unidades). */
const OPCOES_GESTAO: Opcao[] = [
  { para: '/totem/fichas', titulo: 'Fichas dos servidores', descricao: 'Busque por matrícula ou nome, em todas as unidades.', Icone: Users },
  { para: '/totem/pedidos', titulo: 'Pedidos para aprovar', descricao: 'Cursos e documentos enviados pelos servidores.', Icone: ClipboardCheck },
  { para: '/admin', titulo: 'Abrir painel completo', descricao: 'Indicadores, alertas, talentos, relatórios e mais.', Icone: LayoutDashboard },
]

const classeCartao =
  'flex min-h-40 items-center gap-6 rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100 transition active:scale-[0.98] active:ring-4 active:ring-destaque-500 sm:p-8'

function Cartao({ opcao: { para, titulo, descricao, Icone }, contador, aoAbrir }: { opcao: Opcao; contador?: number; aoAbrir?: () => void }) {
  return (
    <Link to={para} onClick={aoAbrir} className={classeCartao}>
      <span className="relative flex size-24 shrink-0 items-center justify-center rounded-2xl bg-marinho-900 text-destaque-500">
        <Icone className="size-14" aria-hidden />
        {!!contador && (
          <span className="absolute -right-3 -top-3 flex min-w-11 items-center justify-center rounded-full bg-amber-400 px-2 py-1 text-xl font-extrabold text-marinho-950 ring-4 ring-white">
            {contador}
          </span>
        )}
      </span>
      <span>
        <span className="block text-3xl font-bold text-marinho-950">{titulo}</span>
        <span className="mt-1 block text-xl text-marinho-700">
          {descricao}
          {!!contador && <strong className="block text-marinho-900">{contador === 1 ? '1 pedido aguardando' : `${contador} pedidos aguardando`}</strong>}
        </span>
      </span>
    </Link>
  )
}

export default function MenuTotem() {
  const { usuario } = useAuth()
  const gestao = ehGestao(usuario)

  // Contador de "Pedidos para aprovar": só os que este usuário pode decidir (nunca os próprios).
  const [pendentes, setPendentes] = useState(0)
  useEffect(() => {
    if (!usuario || !ehGestao(usuario)) return
    let ativo = true
    servicos.solicitacoes
      .listar({ status: 'pendente' }, { usuario, origem: 'totem' })
      .then((l) => ativo && setPendentes(l.filter((s) => podeDecidirSolicitacao(usuario, s)).length))
      .catch(() => undefined)
    return () => {
      ativo = false
    }
  }, [usuario])

  if (!usuario) return null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-extrabold text-marinho-900 sm:text-5xl">Olá, {usuario.nome.split(' ')[0]}!</h1>
        {/* Escopo sempre visível, conforme o nível de acesso. */}
        <p className="mt-3 inline-flex items-center gap-3 rounded-2xl bg-marinho-900 px-5 py-3 text-xl font-semibold text-white">
          {gestao ? (
            <><ShieldCheck className="size-6 shrink-0 text-destaque-500" aria-hidden /> Você também pode consultar e aprovar todos os servidores da PRF-PI</>
          ) : (
            <><Eye className="size-6 shrink-0 text-destaque-500" aria-hidden /> Aqui você consulta a sua ficha</>
          )}
        </p>
        <p className="mt-3 text-2xl text-marinho-700">O que você deseja fazer?</p>
      </div>

      <nav className="grid grid-cols-1 gap-6 landscape:md:grid-cols-2" aria-label="Minha ficha">
        {OPCOES_POLICIAL.map((o) => <Cartao key={o.para} opcao={o} />)}
      </nav>

      {gestao && (
        <section aria-labelledby="titulo-gestao">
          <h2 id="titulo-gestao" className="mb-4 text-3xl font-extrabold text-marinho-900">RH / Gestão</h2>
          <nav className="grid grid-cols-1 gap-6 landscape:md:grid-cols-2" aria-label="RH / Gestão">
            {OPCOES_GESTAO.map((o) => (
              <Cartao key={o.para} opcao={o}
                contador={o.para === '/totem/pedidos' ? pendentes : undefined}
                // O painel aberto daqui herda a saída automática de 2 minutos do totem.
                aoAbrir={o.para === '/admin' ? marcarPainelPeloTotem : undefined} />
            ))}
          </nav>
        </section>
      )}
    </div>
  )
}
