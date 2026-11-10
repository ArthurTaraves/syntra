import { X } from 'lucide-react'
import { useEffect } from 'react'

/** Abre o arquivo dentro do próprio app (no totem não há abas nem barra de endereço). */
export function VisualizadorArquivo({ url, titulo, aoFechar, grande }: { url: string; titulo: string; aoFechar: () => void; grande?: boolean }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])

  return (
    <div role="dialog" aria-modal="true" aria-label={`Arquivo: ${titulo}`} className="fixed inset-0 z-50 flex flex-col bg-marinho-950/80 p-3 sm:p-6">
      <div className="flex items-center justify-between gap-4 rounded-t-2xl bg-marinho-900 px-4 py-3 text-white">
        <p className={`truncate font-semibold ${grande ? 'text-xl' : ''}`}>{titulo}</p>
        <button type="button" onClick={aoFechar}
          className={`flex shrink-0 items-center gap-2 rounded-xl bg-destaque-500 px-5 font-bold text-marinho-950 ${grande ? 'min-h-16 text-xl' : 'min-h-10'}`}>
          <X className="size-6" aria-hidden /> Fechar
        </button>
      </div>
      <iframe src={url} title={titulo} className="w-full flex-1 rounded-b-2xl bg-white" />
    </div>
  )
}
