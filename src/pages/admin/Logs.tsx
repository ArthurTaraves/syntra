import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { Botao, CabecalhoPagina, Campo, Entrada, Paginacao, Selecao, Tabela } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { contemTermos, formatarDataHora, hojeISO } from '../../lib/texto'
import { servicos, type FiltrosLog } from '../../services'
import { ACOES_LOG, type AcaoLog, type LogAcesso, type Origem } from '../../types'

const POR_PAGINA = 25
const ROTULO_ACAO: Record<AcaoLog, string> = {
  consulta: 'Consulta', visualizacao: 'Visualização', download: 'Download/arquivo', edicao: 'Edição', impressao: 'Impressão de extrato', login: 'Login', logout: 'Logout',
}

function exportarCSV(logs: LogAcesso[]) {
  const cab = ['Data e hora', 'Usuário', 'Unidade', 'Ação', 'Alvo', 'Detalhe', 'Resultados', 'Origem']
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const linhas = logs.map((l) =>
    [formatarDataHora(l.data), l.nomeUsuario, l.unidade, ROTULO_ACAO[l.acao], l.alvo, l.detalhe, l.resultados, l.origem].map(esc).join(';'),
  )
  // BOM + ";" para abrir corretamente no Excel em português.
  const blob = new Blob(['﻿' + [cab.join(';'), ...linhas].join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `syntra-logs-${hojeISO()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Logs() {
  const ctx = useContextoAcesso('painel')
  const trintaDias = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const [desde, setDesde] = useState(trintaDias)
  const [ate, setAte] = useState(hojeISO())
  const [origem, setOrigem] = useState<Origem | ''>('')
  const [acao, setAcao] = useState<AcaoLog | ''>('')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)

  const filtros: FiltrosLog = {
    desde: desde ? `${desde}T00:00:00` : undefined,
    ate: ate ? `${ate}T23:59:59.999Z` : undefined,
    origem: origem || undefined,
    acao: acao || undefined,
  }
  const { dados, carregando, erro } = useCarregar(() => servicos.logs.listar(filtros, ctx), [JSON.stringify(filtros), ctx])
  const lista = useMemo(() => (dados ?? []).filter((l) => contemTermos(busca, l.nomeUsuario, l.alvo, l.detalhe)), [dados, busca])

  const exportar = () => {
    exportarCSV(lista)
    void servicos.logs.registrar({ acao: 'download', alvo: 'logs.csv', detalhe: `Exportação de ${lista.length} registros de log`, origem: 'painel' }, ctx.usuario)
  }

  return (
    <>
      <CabecalhoPagina titulo="Logs de acesso" descricao="Registro de quem acessou o quê, quando e de onde (LGPD). Os registros não podem ser editados nem apagados."
        acoes={<Botao variante="secundario" onClick={exportar} disabled={!lista.length}><Download className="size-4" /> Exportar CSV</Botao>} />
      <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-white p-4 ring-1 ring-marinho-100 lg:grid-cols-5">
        <Campo rotulo="De"><Entrada type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPagina(1) }} /></Campo>
        <Campo rotulo="Até"><Entrada type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(1) }} /></Campo>
        <Campo rotulo="Origem">
          <Selecao value={origem} onChange={(e) => { setOrigem(e.target.value as Origem | ''); setPagina(1) }}>
            <option value="">Todas</option><option value="totem">Totem</option><option value="painel">Painel</option>
          </Selecao>
        </Campo>
        <Campo rotulo="Ação">
          <Selecao value={acao} onChange={(e) => { setAcao(e.target.value as AcaoLog | ''); setPagina(1) }}>
            <option value="">Todas</option>
            {ACOES_LOG.map((a) => <option key={a} value={a}>{ROTULO_ACAO[a]}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Usuário ou alvo"><Entrada value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1) }} placeholder="Nome, documento…" /></Campo>
      </div>
      {carregando ? <Carregando /> : erro ? <MensagemErro>{erro}</MensagemErro> : lista.length === 0 ? (
        <NenhumResultado>Nenhum registro de acesso no período e filtros selecionados.</NenhumResultado>
      ) : (
        <>
          <Tabela>
            <thead><tr><th>Data e hora</th><th>Usuário</th><th>Ação</th><th>Alvo</th><th>Origem</th></tr></thead>
            <tbody>
              {lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap">{formatarDataHora(l.data)}</td>
                  <td><p className="font-medium">{l.nomeUsuario}</p><p className="text-xs text-marinho-700">{l.unidade}</p></td>
                  <td>{ROTULO_ACAO[l.acao]}{l.acao === 'consulta' && l.resultados === 0 && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs font-semibold text-amber-900">sem resultado</span>}</td>
                  <td className="max-w-sm"><p className="truncate">{l.detalhe ?? l.alvo}</p>{l.detalhe && <p className="truncate text-xs text-marinho-700">{l.alvo}</p>}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${l.origem === 'totem' ? 'bg-destaque-100 text-marinho-950' : 'bg-marinho-100 text-marinho-900'}`}>{l.origem === 'totem' ? 'Totem' : 'Painel'}</span></td>
                </tr>
              ))}
            </tbody>
          </Tabela>
          <Paginacao pagina={pagina} total={lista.length} porPagina={POR_PAGINA} aoMudar={setPagina} />
        </>
      )}
    </>
  )
}
