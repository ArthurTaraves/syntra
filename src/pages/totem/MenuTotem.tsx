import { FolderOpen, Hash, IdCard, SlidersHorizontal, UserSearch, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const OPCOES: { para: string; titulo: string; descricao: string; Icone: LucideIcon }[] = [
  { para: '/totem/minha-ficha', titulo: 'Minha ficha', descricao: 'Seus dados, lotação, aposentadoria, cursos e talentos. Envie atualizações.', Icone: IdCard },
  { para: '/totem/busca/processo', titulo: 'Buscar por nº de processo', descricao: 'Digite o número do processo SEI, com ou sem pontuação.', Icone: Hash },
  { para: '/totem/busca/servidor', titulo: 'Buscar por matrícula ou nome', descricao: 'Encontre documentos pelo servidor.', Icone: UserSearch },
  { para: '/totem/meus-documentos', titulo: 'Meus documentos', descricao: 'Tudo o que está na sua pasta funcional.', Icone: FolderOpen },
  { para: '/totem/busca/avancada', titulo: 'Busca avançada', descricao: 'Filtre por tipo, período, status e lotação.', Icone: SlidersHorizontal },
]

export default function MenuTotem() {
  const { usuario } = useAuth()
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-extrabold text-marinho-900 sm:text-5xl">Olá, {usuario?.nome.split(' ')[0]}!</h1>
        <p className="mt-2 text-2xl text-marinho-700">O que você deseja consultar?</p>
      </div>
      <nav className="grid grid-cols-1 gap-6 landscape:md:grid-cols-2" aria-label="Opções de consulta">
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
