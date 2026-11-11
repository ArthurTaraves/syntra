import { Briefcase, Search, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { Botao, CabecalhoPagina, Campo, Entrada, Selecao } from '../../components/painel/ui'
import { HORIZONTE_APOSENTADORIA_ANOS } from '../../config/regrasRH'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { buscarTalentos, calcularAposentadoria, formatarDuracao, opcoesDeTalento, type FiltrosTalento, type ResultadoTalento } from '../../lib/rh'
import { servicos } from '../../services'
import { INDICACOES, LOTACOES, type Lotacao } from '../../types'

const ANOS = [0, 5, 10, 15, 20, 25]

/** Banco de talentos: filtros combinados (curso/competência + tempo de casa + unidade + indicação). */
export default function Talentos() {
  const ctx = useContextoAcesso('painel')
  const [termo, setTermo] = useState('')
  const [anos, setAnos] = useState(0)
  const [unidade, setUnidade] = useState<Lotacao | ''>('')
  const [indicacao, setIndicacao] = useState('')
  const [resultado, setResultado] = useState<{ filtros: FiltrosTalento; itens: ResultadoTalento[] } | null>(null)

  const { dados: servidores, carregando, erro } = useCarregar(() => servicos.servidores.listar(ctx), [ctx])

  const buscar = (e?: FormEvent) => {
    e?.preventDefault()
    if (!servidores) return
    const filtros: FiltrosTalento = { termo: termo.trim() || undefined, anosMinimos: anos || undefined, unidade: unidade || undefined, indicacao: indicacao || undefined }
    const itens = buscarTalentos(servidores, filtros)
    setResultado({ filtros, itens })
    // Consulta a dados pessoais: registrada no log de acessos (LGPD).
    const desc = [filtros.termo && `curso/competência: ${filtros.termo}`, filtros.anosMinimos && `${filtros.anosMinimos}+ anos de casa`, filtros.unidade, filtros.indicacao && `indicação: ${filtros.indicacao}`]
      .filter(Boolean).join('; ') || 'todos'
    void servicos.logs.registrar({ acao: 'consulta', alvo: `talentos: ${desc}`, resultados: itens.length, origem: 'painel' }, ctx.usuario)
  }

  const limpar = () => {
    setTermo('')
    setAnos(0)
    setUnidade('')
    setIndicacao('')
    setResultado(null)
  }

  if (carregando) return <Carregando />
  if (erro) return <MensagemErro>{erro}</MensagemErro>

  return (
    <>
      <CabecalhoPagina titulo="Busca de talentos"
        descricao="Encontre perfis para movimentações, capacitações e lideranças combinando critérios, em todas as unidades." />

      <form onSubmit={buscar} className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 ring-1 ring-marinho-100 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.4fr_1fr_auto] lg:items-end">
        <Campo rotulo="Curso ou competência">
          <Entrada list="opcoes-talento" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Ex.: Libras, drones, contratos" />
          <datalist id="opcoes-talento">{opcoesDeTalento(servidores ?? []).map((o) => <option key={o} value={o} />)}</datalist>
        </Campo>
        <Campo rotulo="Tempo de casa">
          <Selecao value={anos} onChange={(e) => setAnos(Number(e.target.value))}>
            {ANOS.map((a) => <option key={a} value={a}>{a ? `Mais de ${a} anos` : 'Qualquer'}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Unidade">
          <Selecao value={unidade} onChange={(e) => setUnidade(e.target.value as Lotacao | '')}>
            <option value="">Todas</option>
            {LOTACOES.map((l) => <option key={l}>{l}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Indicação">
          <Selecao value={indicacao} onChange={(e) => setIndicacao(e.target.value)}>
            <option value="">Qualquer</option>
            {INDICACOES.map((i) => <option key={i}>{i}</option>)}
          </Selecao>
        </Campo>
        <div className="flex gap-2">
          <Botao type="submit"><Search className="size-4" /> Buscar</Botao>
          {resultado && <Botao variante="fantasma" onClick={limpar} aria-label="Limpar filtros"><X className="size-4" /></Botao>}
        </div>
      </form>

      {!resultado ? (
        <p className="text-sm text-marinho-700">
          Exemplo: <strong>Instrutor de armamento e tiro</strong> + <strong>mais de 10 anos</strong> + <strong>Superintendência</strong>. Toda busca fica registrada no log de acessos.
        </p>
      ) : resultado.itens.length === 0 ? (
        <NenhumResultado titulo="Nenhum perfil encontrado">Tente remover algum critério ou usar outro termo.</NenhumResultado>
      ) : (
        <>
          <p className="mb-3 text-sm font-semibold text-marinho-800">{resultado.itens.length} {resultado.itens.length === 1 ? 'perfil encontrado' : 'perfis encontrados'}</p>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {resultado.itens.map(({ servidor: s, anosDeCasa, correspondencias }) => {
              const ap = calcularAposentadoria(s)
              return (
                <li key={s.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-marinho-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/admin/servidores/${s.matricula}`} className="font-bold text-marinho-900 hover:underline">{s.nome}</Link>
                      <p className="text-xs text-marinho-700">{s.matricula} · {s.cargo} · {s.lotacao}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-marinho-50 px-2.5 py-0.5 text-xs font-semibold text-marinho-900">{formatarDuracao(anosDeCasa)} de casa</span>
                  </div>
                  {correspondencias.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {correspondencias.map((c) => <li key={c} className="rounded-full bg-destaque-100 px-2.5 py-0.5 text-xs font-semibold text-marinho-950 ring-1 ring-destaque-500">{c}</li>)}
                    </ul>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-marinho-800">
                    {s.indicacoes.map((i) => <span key={i} className="inline-flex items-center gap-1 rounded-full bg-marinho-800 px-2 py-0.5 text-white"><Briefcase className="size-3" aria-hidden /> {i}</span>)}
                    {ap.proxima && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-950 ring-1 ring-amber-400">Aposentadoria prevista em até {HORIZONTE_APOSENTADORIA_ANOS} anos</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </>
  )
}
