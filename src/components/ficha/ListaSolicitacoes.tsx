import { CheckCircle2, Clock3, Paperclip, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatarData, formatarDataHora } from '../../lib/texto'
import type { Solicitacao, StatusSolicitacao } from '../../types'

const ESTILO: Record<StatusSolicitacao, { rotulo: string; cor: string; Icone: typeof Clock3 }> = {
  pendente: { rotulo: 'Pendente', cor: 'bg-amber-100 text-amber-950 ring-amber-400', Icone: Clock3 },
  aprovada: { rotulo: 'Aprovada', cor: 'bg-emerald-100 text-emerald-950 ring-emerald-300', Icone: CheckCircle2 },
  recusada: { rotulo: 'Recusada', cor: 'bg-red-100 text-red-950 ring-red-300', Icone: XCircle },
}

export function BadgeSolicitacao({ status, grande }: { status: StatusSolicitacao; grande?: boolean }) {
  const { rotulo, cor, Icone } = ESTILO[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${cor} ${grande ? 'px-3 py-1 text-lg' : 'px-2 py-0.5 text-xs'}`}>
      <Icone className={grande ? 'size-5' : 'size-3.5'} aria-hidden /> {rotulo}
    </span>
  )
}

export function resumoSolicitacao(s: Solicitacao): { titulo: string; detalhe: string } {
  if (s.tipo === 'capacitacao' && s.capacitacao) {
    const c = s.capacitacao
    return { titulo: `Curso: ${c.nome}`, detalhe: `${c.area} · ${c.cargaHoraria} h · ${c.instituicao} · concluído em ${formatarData(c.dataConclusao)}` }
  }
  const d = s.documento
  return { titulo: `Documento: ${d?.titulo ?? '—'}`, detalhe: [d?.tipo, d?.descricao].filter(Boolean).join(' · ') }
}

/** Card de um pedido de autoatendimento; `acoes` aparece à direita (aprovar/recusar). */
export function CardSolicitacao({ s, grande, mostrarServidor, acoes }: { s: Solicitacao; grande?: boolean; mostrarServidor?: ReactNode; acoes?: ReactNode }) {
  const { titulo, detalhe } = resumoSolicitacao(s)
  const pequeno = grande ? 'text-base' : 'text-xs'
  return (
    <li className={`flex flex-col gap-3 rounded-2xl bg-white ring-1 ring-marinho-100 sm:flex-row sm:items-start sm:justify-between ${grande ? 'p-5' : 'p-4'}`}>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <BadgeSolicitacao status={s.status} grande={grande} />
          {mostrarServidor}
        </div>
        <p className={`font-semibold text-marinho-950 ${grande ? 'text-xl' : 'text-sm'}`}>{titulo}</p>
        {detalhe && <p className={`text-marinho-700 ${pequeno}`}>{detalhe}</p>}
        {s.nomeArquivo && (
          <p className={`mt-1 inline-flex items-center gap-1 text-marinho-800 ${pequeno}`}>
            <Paperclip className="size-3.5" aria-hidden /> {s.nomeArquivo}
          </p>
        )}
        <p className={`mt-1 text-marinho-600 ${pequeno}`}>
          Enviado em {formatarDataHora(s.criadaEm)} pelo {s.origem === 'totem' ? 'totem' : 'computador'}
          {s.decididaEm && ` · ${s.status === 'aprovada' ? 'aprovado' : 'recusado'} por ${s.decididaPorNome} em ${formatarDataHora(s.decididaEm)}`}
        </p>
        {s.motivoRecusa && <p className={`mt-1 font-semibold text-red-900 ${pequeno}`}>Motivo: {s.motivoRecusa}</p>}
      </div>
      {acoes && <div className="flex shrink-0 gap-2">{acoes}</div>}
    </li>
  )
}
