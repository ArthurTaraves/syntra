import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ResultadosTotem } from '../../components/totem/ResultadosTotem'
import { TituloTotem } from '../../components/totem/TituloTotem'
import type { FiltrosDocumento } from '../../services'
import { LOTACOES, STATUS_DOCUMENTO, TIPOS_DOCUMENTO, type Lotacao, type StatusDocumento, type TipoDocumento } from '../../types'

const ano = new Date().getFullYear()
const PERIODOS = [
  { id: '', rotulo: 'Qualquer data', inicio: undefined, fim: undefined },
  { id: '1a', rotulo: 'Último ano', inicio: `${ano - 1}-01-01`, fim: undefined },
  { id: '5a', rotulo: 'Últimos 5 anos', inicio: `${ano - 5}-01-01`, fim: undefined },
  { id: '2015-2020', rotulo: '2015 a 2020', inicio: '2015-01-01', fim: '2020-12-31' },
  { id: 'ant2015', rotulo: 'Antes de 2015', inicio: undefined, fim: '2014-12-31' },
] as const

function Chips<T extends string>({ titulo, opcoes, valor, aoMudar }: { titulo: string; opcoes: readonly T[]; valor: T | ''; aoMudar: (v: T | '') => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xl font-bold text-marinho-900">{titulo}</legend>
      <div className="flex flex-wrap gap-3">
        <Chip ativo={valor === ''} onClick={() => aoMudar('')}>Todos</Chip>
        {opcoes.map((o) => (
          <Chip key={o} ativo={valor === o} onClick={() => aoMudar(valor === o ? '' : o)}>{o}</Chip>
        ))}
      </div>
    </fieldset>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={ativo}
      className={`min-h-16 rounded-2xl px-5 text-xl font-semibold ring-2 transition active:scale-95 ${
        ativo ? 'bg-marinho-800 text-white ring-marinho-800' : 'bg-white text-marinho-900 ring-marinho-100'
      }`}>
      {children}
    </button>
  )
}

export default function BuscaAvancada() {
  const [params, setParams] = useSearchParams()
  const buscou = params.get('buscou') === '1'
  const [tipo, setTipo] = useState<TipoDocumento | ''>((params.get('tipo') as TipoDocumento) ?? '')
  const [status, setStatus] = useState<StatusDocumento | ''>((params.get('status') as StatusDocumento) ?? '')
  const [lotacao, setLotacao] = useState<Lotacao | ''>((params.get('lotacao') as Lotacao) ?? '')
  const [periodo, setPeriodo] = useState(params.get('periodo') ?? '')

  const p = PERIODOS.find((x) => x.id === periodo) ?? PERIODOS[0]
  const filtros: FiltrosDocumento = {
    tipo: (params.get('tipo') as TipoDocumento) || undefined,
    status: (params.get('status') as StatusDocumento) || undefined,
    lotacao: (params.get('lotacao') as Lotacao) || undefined,
    dataInicio: (PERIODOS.find((x) => x.id === params.get('periodo')) ?? PERIODOS[0]).inicio,
    dataFim: (PERIODOS.find((x) => x.id === params.get('periodo')) ?? PERIODOS[0]).fim,
  }

  const buscar = () => {
    const novo: Record<string, string> = { buscou: '1' }
    if (tipo) novo.tipo = tipo
    if (status) novo.status = status
    if (lotacao) novo.lotacao = lotacao
    if (periodo) novo.periodo = periodo
    setParams(novo, { replace: true })
  }

  if (buscou)
    return (
      <>
        <TituloTotem titulo="Resultado da busca avançada" voltarPara="/totem/menu" />
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {[filtros.tipo, filtros.status, filtros.lotacao, periodo && p.rotulo].filter(Boolean).map((f) => (
            <span key={String(f)} className="rounded-full bg-marinho-100 px-4 py-2 text-lg font-semibold text-marinho-900">{f}</span>
          ))}
          <button type="button" onClick={() => setParams({ ...Object.fromEntries(params), buscou: '0' }, { replace: true })}
            className="flex min-h-16 items-center gap-2 rounded-2xl bg-white px-5 text-xl font-semibold text-marinho-900 ring-2 ring-marinho-100">
            <X className="size-6" aria-hidden /> Alterar filtros
          </button>
        </div>
        <ResultadosTotem filtros={filtros} dicaVazio="Tente remover algum filtro ou escolher um período maior." />
      </>
    )

  return (
    <>
      <TituloTotem titulo="Busca avançada" subtitulo="Escolha os filtros e toque em Buscar." />
      <div className="flex flex-col gap-8 rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100">
        <Chips titulo="Tipo de documento" opcoes={TIPOS_DOCUMENTO} valor={tipo} aoMudar={setTipo} />
        <fieldset>
          <legend className="mb-3 text-xl font-bold text-marinho-900">Período</legend>
          <div className="flex flex-wrap gap-3">
            {PERIODOS.map((x) => (
              <Chip key={x.id} ativo={periodo === x.id} onClick={() => setPeriodo(x.id)}>{x.rotulo}</Chip>
            ))}
          </div>
        </fieldset>
        <Chips titulo="Status" opcoes={STATUS_DOCUMENTO} valor={status} aoMudar={setStatus} />
        <Chips titulo="Lotação" opcoes={LOTACOES} valor={lotacao} aoMudar={setLotacao} />
      </div>
      <button type="button" onClick={buscar}
        className="sticky bottom-4 mt-6 flex min-h-20 w-full items-center justify-center gap-3 rounded-2xl bg-marinho-800 text-2xl font-bold text-white shadow-xl active:bg-marinho-700">
        <Search className="size-8" aria-hidden /> Buscar
      </button>
    </>
  )
}
