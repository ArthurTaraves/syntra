import { Lock, ShieldAlert } from 'lucide-react'
import { ROTULO_NIVEL } from '../services'
import type { NivelAcesso, SituacaoProcesso, StatusDocumento } from '../types'

const COR_STATUS: Record<StatusDocumento, string> = {
  Ativo: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
  Arquivado: 'bg-slate-200 text-slate-900 ring-slate-400',
  'Em tramitação': 'bg-amber-100 text-amber-900 ring-amber-400',
}

const COR_SITUACAO: Record<SituacaoProcesso, string> = {
  'Em andamento': 'bg-amber-100 text-amber-900 ring-amber-400',
  Concluído: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
  Arquivado: 'bg-slate-200 text-slate-900 ring-slate-400',
  Sobrestado: 'bg-orange-100 text-orange-900 ring-orange-400',
}

const tam = (grande?: boolean) => (grande ? 'px-3 py-1 text-lg' : 'px-2 py-0.5 text-xs')

export function BadgeStatus({ status, grande }: { status: StatusDocumento; grande?: boolean }) {
  return <span className={`inline-flex items-center rounded-full font-semibold ring-1 ${COR_STATUS[status]} ${tam(grande)}`}>{status}</span>
}

export function BadgeSituacao({ situacao, grande }: { situacao: SituacaoProcesso; grande?: boolean }) {
  return <span className={`inline-flex items-center rounded-full font-semibold ring-1 ${COR_SITUACAO[situacao]} ${tam(grande)}`}>{situacao}</span>
}

export function BadgeNivel({ nivel, grande }: { nivel: NivelAcesso; grande?: boolean }) {
  if (nivel === 'publico-interno')
    return <span className={`inline-flex items-center rounded-full bg-marinho-50 font-medium text-marinho-800 ring-1 ring-marinho-100 ${tam(grande)}`}>{ROTULO_NIVEL[nivel]}</span>
  const Icone = nivel === 'sigiloso' ? ShieldAlert : Lock
  const cor = nivel === 'sigiloso' ? 'bg-red-100 text-red-900 ring-red-300' : 'bg-violet-100 text-violet-900 ring-violet-300'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${cor} ${tam(grande)}`}>
      <Icone className={grande ? 'size-5' : 'size-3'} aria-hidden />
      {ROTULO_NIVEL[nivel]}
    </span>
  )
}
