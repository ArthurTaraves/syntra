import { formatarData } from '../lib/texto'
import type { Movimentacao } from '../types'

/** Histórico de tramitação do processo, do mais recente para o mais antigo. */
export function LinhaDoTempo({ historico, grande }: { historico: Movimentacao[]; grande?: boolean }) {
  const itens = [...historico].sort((a, b) => b.data.localeCompare(a.data))
  return (
    <ol className="relative ml-3 border-l-4 border-marinho-100">
      {itens.map((m, i) => (
        <li key={`${m.data}-${i}`} className={`relative pl-6 ${grande ? 'pb-7' : 'pb-5'} last:pb-0`}>
          <span
            className={`absolute -left-[0.8rem] top-1 block rounded-full border-4 border-white ${
              i === 0 ? 'bg-destaque-500' : 'bg-marinho-600'
            } ${grande ? 'size-6' : 'size-5'}`}
            aria-hidden
          />
          <p className={`font-bold text-marinho-900 ${grande ? 'text-xl' : 'text-sm'}`}>
            {formatarData(m.data)} · <span className="font-semibold text-marinho-700">{m.unidade}</span>
            {i === 0 && <span className="ml-2 rounded bg-destaque-100 px-2 text-xs font-bold text-marinho-950">mais recente</span>}
          </p>
          <p className={`text-marinho-950 ${grande ? 'text-lg' : 'text-sm'}`}>{m.descricao}</p>
        </li>
      ))}
    </ol>
  )
}
