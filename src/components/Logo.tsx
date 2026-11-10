import { FolderSearch } from 'lucide-react'

export function Logo({ tamanho = 'md', claro = true }: { tamanho?: 'sm' | 'md' | 'xl'; claro?: boolean }) {
  const t = { sm: 'text-xl', md: 'text-3xl', xl: 'text-7xl sm:text-8xl' }[tamanho]
  const i = { sm: 'size-6', md: 'size-9', xl: 'size-20 sm:size-24' }[tamanho]
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-wide ${t} ${claro ? 'text-white' : 'text-marinho-900'}`}>
      <FolderSearch className={`${i} text-destaque-500`} aria-hidden />
      <span>
        SYN<span className="text-destaque-500">TRA</span>
      </span>
    </span>
  )
}
