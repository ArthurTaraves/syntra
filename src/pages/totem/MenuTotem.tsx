import { Eye, FolderOpen, Hash, IdCard, Inbox, SlidersHorizontal, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth, useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { podeDecidirSolicitacao, servicos } from '../../services'
import type { Perfil, Usuario } from '../../types'

interface Opcao {
  para: string
  titulo: string
  descricao: string
  Icone: LucideIcon
  /** Mostra o contador de pedidos pendentes no card. */
  contador?: boolean
}

/** Opções do totem conforme a PROPOSTA: servidor vê só a própria ficha; gestor, a unidade; RH, tudo. */
export function opcoesDoTotem(u: Usuario): Opcao[] {
  const servidor: Opcao[] = [
    { para: '/totem/minha-ficha', titulo: 'Minha ficha', descricao: 'Seus dados, lotação, aposentadoria, cursos e talentos. Envie atualizações.', Icone: IdCard },
    { para: '/totem/meus-documentos', titulo: 'Meus documentos', descricao: 'Seus documentos e onde estão guardados.', Icone: FolderOpen },
    {
      para: '/totem/busca/processo',
      titulo: 'Buscar por nº de processo',
      descricao:
        u.perfil === 'servidor'
          ? 'Somente os seus processos. Com ou sem pontuação.'
          : u.perfil === 'gestor'
            ? 'Processos da sua unidade. Com ou sem pontuação.'
            : 'Processos de todas as unidades. Com ou sem pontuação.',
      Icone: Hash,
    },
  ]
  if (u.perfil === 'servidor') return servidor
  const gestor = u.perfil === 'gestor'
  return [
    ...servidor,
    {
      para: '/totem/busca/servidor',
      titulo: gestor ? 'Servidores da minha unidade' : 'Fichas dos servidores',
      descricao: gestor ? `Busque por matrícula ou nome na ${u.unidade}.` : 'Busque qualquer servidor da PRF-PI por matrícula ou nome.',
      Icone: Users,
    },
    {
      para: '/totem/busca/avancada',
      titulo: 'Busca avançada',
      descricao: gestor ? 'Documentos da sua unidade por tipo, período e status.' : 'Documentos por tipo, período, status e lotação.',
      Icone: SlidersHorizontal,
    },
    { para: '/totem/pedidos', titulo: 'Pedidos para aprovar', descricao: 'Cursos e documentos enviados pelos servidores.', Icone: Inbox, contador: true },
  ]
}

const ESCOPO: Record<Perfil, (u: Usuario) => string> = {
  servidor: () => 'Você vê apenas a sua ficha',
  gestor: (u) => `Você vê os servidores da ${u.unidade}`,
  admin: () => 'Você vê todos os servidores da PRF-PI',
}

export default function MenuTotem() {
  const { usuario } = useAuth()
  const ctx = useContextoAcesso('totem')
  const { dados: pendentes } = useCarregar(
    async () =>
      ctx.usuario.perfil === 'servidor'
        ? 0
        : (await servicos.solicitacoes.listar({ status: 'pendente' }, ctx)).filter((s) => podeDecidirSolicitacao(ctx.usuario, s)).length,
    [ctx],
  )
  if (!usuario) return null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-extrabold text-marinho-900 sm:text-5xl">Olá, {usuario.nome.split(' ')[0]}!</h1>
        {/* Escopo de acesso sempre visível (LGPD: cada perfil sabe o que pode ver). */}
        <p className="mt-3 inline-flex items-center gap-3 rounded-2xl bg-marinho-900 px-5 py-3 text-xl font-semibold text-white">
          <Eye className="size-6 text-destaque-500" aria-hidden /> {ESCOPO[usuario.perfil](usuario)}
        </p>
        <p className="mt-3 text-2xl text-marinho-700">O que você deseja consultar?</p>
      </div>
      <nav className="grid grid-cols-1 gap-6 landscape:md:grid-cols-2" aria-label="Opções de consulta">
        {opcoesDoTotem(usuario).map(({ para, titulo, descricao, Icone, contador }) => (
          <Link key={para} to={para}
            className="relative flex min-h-40 items-center gap-6 rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100 transition active:scale-[0.98] active:ring-4 active:ring-destaque-500 sm:p-8">
            <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-marinho-900 text-destaque-500">
              <Icone className="size-14" aria-hidden />
            </span>
            <span>
              <span className="block text-3xl font-bold text-marinho-950">{titulo}</span>
              <span className="mt-1 block text-xl text-marinho-700">{descricao}</span>
            </span>
            {contador && !!pendentes && (
              <span className="absolute right-5 top-5 rounded-full bg-amber-400 px-4 py-1 text-xl font-extrabold text-marinho-950" aria-label={`${pendentes} pedidos pendentes`}>
                {pendentes}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}
