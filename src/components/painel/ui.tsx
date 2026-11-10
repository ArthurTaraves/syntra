import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'destaque' | 'perigo' | 'fantasma'
const VARIANTES: Record<Variante, string> = {
  primario: 'bg-marinho-800 text-white hover:bg-marinho-700',
  secundario: 'bg-white text-marinho-900 ring-1 ring-marinho-100 hover:bg-marinho-50',
  destaque: 'bg-destaque-500 text-marinho-950 hover:bg-destaque-400',
  perigo: 'bg-red-700 text-white hover:bg-red-600',
  fantasma: 'text-marinho-800 hover:bg-marinho-50',
}

export function Botao({ variante = 'primario', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button type="button" {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque-500 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`} />
  )
}

const classeCampo =
  'w-full rounded-lg border border-marinho-100 bg-white px-3 py-2 text-sm text-marinho-950 outline-none focus:border-marinho-600 focus:ring-2 focus:ring-marinho-100 aria-[invalid=true]:border-red-500'

export function Campo({ rotulo, erro, dica, children }: { rotulo: string; erro?: string; dica?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-marinho-900">{rotulo}</span>
      {children}
      {dica && !erro && <span className="text-xs text-marinho-700">{dica}</span>}
      {erro && <span className="text-xs font-semibold text-red-700">{erro}</span>}
    </label>
  )
}

export const Entrada = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${classeCampo} ${p.className ?? ''}`} />
export const Selecao = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${classeCampo} ${p.className ?? ''}`} />
export const AreaTexto = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`${classeCampo} ${p.className ?? ''}`} />

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-marinho-100 ${className}`}>{children}</section>
}

export function CabecalhoPagina({ titulo, descricao, acoes }: { titulo: string; descricao?: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-marinho-900">{titulo}</h1>
        {descricao && <p className="text-sm text-marinho-700">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2 print:hidden">{acoes}</div>}
    </div>
  )
}

export function Paginacao({ pagina, total, porPagina, aoMudar }: { pagina: number; total: number; porPagina: number; aoMudar: (p: number) => void }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  if (total === 0) return null
  const ini = (pagina - 1) * porPagina + 1
  const fim = Math.min(total, pagina * porPagina)
  return (
    <nav className="mt-4 flex items-center justify-between gap-4 text-sm text-marinho-800 print:hidden" aria-label="Paginação">
      <span>
        {ini}–{fim} de {total}
      </span>
      <div className="flex items-center gap-2">
        <Botao variante="secundario" disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)} aria-label="Página anterior">
          <ChevronLeft className="size-4" />
        </Botao>
        <span>
          Página {pagina} de {paginas}
        </span>
        <Botao variante="secundario" disabled={pagina >= paginas} onClick={() => aoMudar(pagina + 1)} aria-label="Próxima página">
          <ChevronRight className="size-4" />
        </Botao>
      </div>
    </nav>
  )
}

export function Modal({ titulo, aoFechar, children, largura = 'max-w-lg' }: { titulo: string; aoFechar: () => void; children: ReactNode; largura?: string }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])
  return (
    <div role="dialog" aria-modal="true" aria-label={titulo} className="fixed inset-0 z-50 flex items-center justify-center bg-marinho-950/60 p-4" onClick={aoFechar}>
      <div className={`w-full ${largura} max-h-[90dvh] overflow-auto rounded-xl bg-white p-6 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-marinho-900">{titulo}</h2>
          <button type="button" onClick={aoFechar} className="rounded-lg p-1 text-marinho-700 hover:bg-marinho-50" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Tabela({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-marinho-100">
      <table className="w-full min-w-[720px] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_thead]:bg-marinho-50 [&_thead]:text-marinho-900 [&_tbody_tr]:border-t [&_tbody_tr]:border-marinho-50 [&_tbody_tr:hover]:bg-fundo">
        {children}
      </table>
    </div>
  )
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'alerta' | 'sucesso'; children: ReactNode }) {
  const cor = {
    info: 'border-marinho-100 bg-marinho-50 text-marinho-900',
    alerta: 'border-amber-300 bg-amber-50 text-amber-950',
    sucesso: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  }[tipo]
  return <div role={tipo === 'alerta' ? 'alert' : 'status'} className={`rounded-lg border p-3 text-sm ${cor}`}>{children}</div>
}
