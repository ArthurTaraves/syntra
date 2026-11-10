import { AlertTriangle, Loader2, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'

export function Carregando({ texto = 'Carregando…', grande }: { texto?: string; grande?: boolean }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 py-12 text-marinho-700 ${grande ? 'text-2xl' : 'text-base'}`}>
      <Loader2 className={`${grande ? 'size-14' : 'size-8'} animate-spin`} aria-hidden />
      <span>{texto}</span>
    </div>
  )
}

export function NenhumResultado({
  titulo = 'Nenhum resultado encontrado',
  children,
  grande,
}: {
  titulo?: string
  children?: ReactNode
  grande?: boolean
}) {
  return (
    <div className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-marinho-100 bg-white px-6 py-12 text-center ${grande ? 'text-xl' : ''}`}>
      <SearchX className={`${grande ? 'size-16' : 'size-10'} text-marinho-600`} aria-hidden />
      <p className={`${grande ? 'text-3xl' : 'text-lg'} font-bold text-marinho-900`}>{titulo}</p>
      {children && <div className="max-w-xl text-marinho-700">{children}</div>}
    </div>
  )
}

export function MensagemErro({ children, grande }: { children: ReactNode; grande?: boolean }) {
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-red-900 ${grande ? 'text-xl' : ''}`}>
      <AlertTriangle className="mt-0.5 size-6 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
