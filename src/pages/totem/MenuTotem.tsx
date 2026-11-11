import { Eye, FolderOpen, IdCard, Inbox, Monitor, Printer, Upload, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Totem = "Área do servidor": o MESMO menu para todos os perfis. Cada pessoa consulta
 * apenas a própria ficha (gestor e RH também são policiais). Gerenciar servidores é no painel do RH.
 */
const OPCOES: { para: string; titulo: string; descricao: string; Icone: LucideIcon }[] = [
  { para: '/totem/minha-ficha', titulo: 'Minha ficha', descricao: 'Seus dados, lotação, aposentadoria, cursos e talentos.', Icone: IdCard },
  { para: '/totem/meus-documentos', titulo: 'Meus documentos e processos', descricao: 'Onde estão guardados e em que pé estão.', Icone: FolderOpen },
  { para: '/totem/minha-ficha/enviar', titulo: 'Enviar curso ou documento', descricao: 'Atualize sua ficha; o gestor ou o RH aprova.', Icone: Upload },
  { para: '/totem/solicitacoes', titulo: 'Minhas solicitações', descricao: 'Acompanhe o que você enviou: pendente, aprovado ou recusado.', Icone: Inbox },
  { para: '/totem/extrato', titulo: 'Imprimir extrato da ficha', descricao: 'Escolha as seções e imprima, com código de verificação.', Icone: Printer },
]

export default function MenuTotem() {
  const { usuario } = useAuth()
  if (!usuario) return null
  const gestao = usuario.perfil !== 'servidor'

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-extrabold text-marinho-900 sm:text-5xl">Olá, {usuario.nome.split(' ')[0]}!</h1>
        {/* Escopo sempre visível: no totem, cada pessoa vê só a própria ficha. */}
        <div className="mt-3 inline-flex flex-col gap-1 rounded-2xl bg-marinho-900 px-5 py-3 text-white">
          <p className="flex items-center gap-3 text-xl font-semibold">
            <Eye className="size-6 shrink-0 text-destaque-500" aria-hidden /> Aqui você consulta apenas a sua ficha
          </p>
          {gestao && (
            <p className="flex items-center gap-3 text-lg text-marinho-100">
              <Monitor className="size-6 shrink-0 text-destaque-500" aria-hidden /> Para gerenciar servidores, use o painel do RH no computador.
            </p>
          )}
        </div>
        <p className="mt-3 text-2xl text-marinho-700">O que você deseja fazer?</p>
      </div>
      <nav className="grid grid-cols-1 gap-6 landscape:md:grid-cols-2" aria-label="Opções da área do servidor">
        {OPCOES.map(({ para, titulo, descricao, Icone }) => (
          <Link key={para} to={para}
            className="flex min-h-40 items-center gap-6 rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100 transition active:scale-[0.98] active:ring-4 active:ring-destaque-500 sm:p-8">
            <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-marinho-900 text-destaque-500">
              <Icone className="size-14" aria-hidden />
            </span>
            <span>
              <span className="block text-3xl font-bold text-marinho-950">{titulo}</span>
              <span className="mt-1 block text-xl text-marinho-700">{descricao}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
