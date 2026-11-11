import { Printer } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Carregando, MensagemErro } from '../../components/Estados'
import { Aviso, Botao, CabecalhoPagina, Campo, Cartao, Entrada, Selecao, Tabela } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { formatarData, formatarDataHora, hojeISO } from '../../lib/texto'
import { podeVerLogs, servicos } from '../../services'
import { LOTACOES, STATUS_DOCUMENTO, TIPOS_DOCUMENTO, type Lotacao } from '../../types'

// Série única por gráfico: um só tom (azul-marinho institucional), sem legenda — o título nomeia a série.
const COR_SERIE = '#17387a'
const COR_GRADE = '#dde6f5'
const COR_EIXO = '#3b4a66'
const eixo = { fontSize: 12, fill: COR_EIXO }
const dicaEstilo = { borderRadius: 8, border: '1px solid #dde6f5', fontSize: 13 }

function Grafico({ titulo, descricao, children, altura = 280 }: { titulo: string; descricao?: string; children: ReactNode; altura?: number }) {
  return (
    <Cartao className="break-inside-avoid">
      <h2 className="font-bold text-marinho-900">{titulo}</h2>
      {descricao && <p className="mb-3 text-xs text-marinho-700">{descricao}</p>}
      <div style={{ height: altura }} className="mt-2">
        <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
      </div>
    </Cartao>
  )
}

const contar = <T,>(itens: T[], chave: (t: T) => string, ordem: readonly string[]) =>
  ordem.map((nome) => ({ nome, total: itens.filter((i) => chave(i) === nome).length }))

export default function Relatorios() {
  const ctx = useContextoAcesso('painel')
  const admin = podeVerLogs(ctx.usuario)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [lotacao, setLotacao] = useState<Lotacao | ''>('')

  const { dados, carregando, erro } = useCarregar(async () => {
    const docs = await servicos.documentos.buscar({}, ctx, { registrar: false })
    const desdeLogs = new Date(Date.now() - 365 * 86400000).toISOString()
    const logs = admin ? await servicos.logs.listar({ desde: desdeLogs }, ctx) : null
    return { docs, logs }
  }, [ctx, admin])

  const r = useMemo(() => {
    if (!dados) return null
    const docs = dados.docs.filter(
      (d) => (!lotacao || d.lotacao === lotacao) && (!inicio || d.dataDocumento >= inicio) && (!fim || d.dataDocumento <= fim),
    )
    const base = {
      total: docs.length,
      porTipo: contar(docs, (d) => d.tipo, TIPOS_DOCUMENTO).sort((a, b) => b.total - a.total),
      porLotacao: contar(docs, (d) => d.lotacao, LOTACOES).map((x) => ({ ...x, nome: x.nome.replace('Delegacia de ', 'Del. ') })),
      porStatus: contar(docs, (d) => d.status, STATUS_DOCUMENTO),
    }
    if (!dados.logs) return { ...base, logs: null }

    // Logs: filtro de lotação = unidade do usuário; período padrão = últimos 30 dias.
    const iniLogs = inicio || new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
    const fimLogs = fim || hojeISO()
    const logs = dados.logs.filter((l) => (!lotacao || l.unidade === lotacao) && l.data.slice(0, 10) >= iniLogs && l.data.slice(0, 10) <= fimLogs)

    const dias: { dia: string; rotulo: string; consultas: number }[] = []
    const ultimoDia = new Date(`${fimLogs}T12:00:00`)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(ultimoDia.getTime() - i * 86400000)
      const iso = d.toISOString().slice(0, 10)
      dias.push({ dia: iso, rotulo: formatarData(iso).slice(0, 5), consultas: 0 })
    }
    const idx = new Map(dias.map((d, i) => [d.dia, i]))
    logs.filter((l) => l.origem === 'totem' && l.acao === 'consulta').forEach((l) => {
      const i = idx.get(l.data.slice(0, 10))
      if (i !== undefined) dias[i].consultas++
    })

    const vis = new Map<string, { titulo: string; total: number }>()
    // Visualizações de documento (exclui as de ficha do servidor e de processo).
    const ehDocumento = (d?: string) => !d?.startsWith('Ficha:') && !d?.startsWith('Pasta funcional:') && !d?.startsWith('Processo ')
    logs.filter((l) => l.acao === 'visualizacao' && ehDocumento(l.detalhe))
      .forEach((l) => {
        const v = vis.get(l.alvo) ?? { titulo: l.detalhe ?? l.alvo, total: 0 }
        v.total++
        vis.set(l.alvo, v)
      })
    const top10 = [...vis.values()].sort((a, b) => b.total - a.total).slice(0, 10)

    const semRes = new Map<string, { termo: string; total: number; ultima: string }>()
    logs.filter((l) => l.acao === 'consulta' && l.resultados === 0).forEach((l) => {
      const termo = l.alvo
      const v = semRes.get(termo) ?? { termo, total: 0, ultima: l.data }
      v.total++
      if (l.data > v.ultima) v.ultima = l.data
      semRes.set(termo, v)
    })
    const semResultado = [...semRes.values()].sort((a, b) => b.total - a.total)
    return { ...base, logs: { dias, top10, semResultado, periodo: `${formatarData(iniLogs)} a ${formatarData(fimLogs)}` } }
  }, [dados, inicio, fim, lotacao])

  return (
    <>
      <CabecalhoPagina titulo="Relatórios e indicadores"
        descricao="Todas as unidades da Superintendência"
        acoes={<Botao variante="secundario" onClick={() => window.print()}><Printer className="size-4" /> Exportar PDF</Botao>} />
      <p className="mb-4 hidden text-xs print:block">Relatório gerado em {formatarDataHora(new Date().toISOString())} por {ctx.usuario.nome} · SYNTRA · PRF-PI</p>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 ring-1 ring-marinho-100 sm:grid-cols-3 print:hidden">
        <Campo rotulo="Período: de" dica="Documentos: pela data do documento. Uso do totem: padrão últimos 30 dias.">
          <Entrada type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </Campo>
        <Campo rotulo="Até"><Entrada type="date" value={fim} max={hojeISO()} onChange={(e) => setFim(e.target.value)} /></Campo>
        {ctx.usuario.perfil === 'admin' && (
          <Campo rotulo="Lotação">
            <Selecao value={lotacao} onChange={(e) => setLotacao(e.target.value as Lotacao | '')}>
              <option value="">Todas</option>
              {LOTACOES.map((l) => <option key={l}>{l}</option>)}
            </Selecao>
          </Campo>
        )}
      </div>

      {carregando && <Carregando texto="Calculando indicadores…" />}
      {erro && <MensagemErro>{erro}</MensagemErro>}
      {r && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 print:block print:space-y-6">
          <Grafico titulo="Documentos por tipo" descricao={`${r.total} documentos no filtro atual`}>
            <BarChart data={r.porTipo} margin={{ top: 8, right: 8, left: -16, bottom: 48 }}>
              <CartesianGrid vertical={false} stroke={COR_GRADE} />
              <XAxis dataKey="nome" tick={eixo} interval={0} angle={-35} textAnchor="end" tickLine={false} axisLine={{ stroke: COR_GRADE }} />
              <YAxis allowDecimals={false} tick={eixo} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#eef3fb' }} contentStyle={dicaEstilo} formatter={(v) => [v, 'Documentos']} />
              <Bar dataKey="total" fill={COR_SERIE} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </Grafico>

          <Grafico titulo="Documentos por lotação">
            <BarChart data={r.porLotacao} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid horizontal={false} stroke={COR_GRADE} />
              <XAxis type="number" allowDecimals={false} tick={eixo} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="nome" width={150} tick={eixo} tickLine={false} axisLine={{ stroke: COR_GRADE }} />
              <Tooltip cursor={{ fill: '#eef3fb' }} contentStyle={dicaEstilo} formatter={(v) => [v, 'Documentos']} />
              <Bar dataKey="total" fill={COR_SERIE} radius={[0, 4, 4, 0]} maxBarSize={24} label={{ position: 'right', fontSize: 12, fill: COR_EIXO }} />
            </BarChart>
          </Grafico>

          <Grafico titulo="Status dos documentos" descricao="Ativos × arquivados × em tramitação" altura={220}>
            <BarChart data={r.porStatus} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 8 }}>
              <CartesianGrid horizontal={false} stroke={COR_GRADE} />
              <XAxis type="number" allowDecimals={false} tick={eixo} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="nome" width={110} tick={eixo} tickLine={false} axisLine={{ stroke: COR_GRADE }} />
              <Tooltip cursor={{ fill: '#eef3fb' }} contentStyle={dicaEstilo} formatter={(v) => [v, 'Documentos']} />
              <Bar dataKey="total" fill={COR_SERIE} radius={[0, 4, 4, 0]} maxBarSize={28} label={{ position: 'right', fontSize: 12, fill: COR_EIXO }} />
            </BarChart>
          </Grafico>

          {r.logs ? (
            <>
              <Grafico titulo="Consultas no totem por dia" descricao={`30 dias até ${r.logs.periodo.split(' a ')[1]}`}>
                <LineChart data={r.logs.dias} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
                  <CartesianGrid vertical={false} stroke={COR_GRADE} />
                  <XAxis dataKey="rotulo" tick={eixo} tickLine={false} axisLine={{ stroke: COR_GRADE }} interval={4} />
                  <YAxis allowDecimals={false} tick={eixo} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={dicaEstilo} cursor={{ stroke: COR_EIXO, strokeDasharray: '3 3' }} formatter={(v) => [v, 'Consultas']} labelFormatter={(l) => `Dia ${l}`} />
                  <Line type="monotone" dataKey="consultas" stroke={COR_SERIE} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </Grafico>

              <Cartao className="break-inside-avoid">
                <h2 className="font-bold text-marinho-900">Documentos mais consultados (top 10)</h2>
                <p className="mb-3 text-xs text-marinho-700">Visualizações de detalhe no totem e no painel · {r.logs.periodo}</p>
                {r.logs.top10.length === 0 ? <p className="text-sm text-marinho-700">Sem visualizações no período.</p> : (
                  <ol className="flex flex-col gap-2">
                    {r.logs.top10.map((t, i) => (
                      <li key={t.titulo + i} className="flex items-center gap-3 text-sm">
                        <span className="w-5 text-right font-bold tabular-nums text-marinho-700">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{t.titulo}</p>
                          <div className="mt-0.5 h-1.5 rounded-full bg-marinho-50">
                            <div className="h-1.5 rounded-full" style={{ width: `${(t.total / r.logs!.top10[0].total) * 100}%`, background: COR_SERIE }} />
                          </div>
                        </div>
                        <span className="w-8 text-right font-semibold tabular-nums">{t.total}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Cartao>

              <Cartao className="break-inside-avoid xl:col-span-2">
                <h2 className="font-bold text-marinho-900">Buscas sem resultado</h2>
                <p className="mb-3 text-xs text-marinho-700">
                  Indicam documentos que podem estar faltando no acervo digital · {r.logs.periodo}
                </p>
                {r.logs.semResultado.length === 0 ? <p className="text-sm text-marinho-700">Nenhuma busca sem resultado no período. 🎉</p> : (
                  <Tabela>
                    <thead><tr><th>Busca realizada</th><th className="text-right">Ocorrências</th><th>Última vez</th></tr></thead>
                    <tbody>
                      {r.logs.semResultado.map((s) => (
                        <tr key={s.termo}><td>{s.termo}</td><td className="text-right font-semibold tabular-nums">{s.total}</td><td>{formatarDataHora(s.ultima)}</td></tr>
                      ))}
                    </tbody>
                  </Tabela>
                )}
              </Cartao>
            </>
          ) : (
            <div className="xl:col-span-2">
              <Aviso>
                Os indicadores de <strong>uso do totem</strong> (consultas por dia, documentos mais consultados e buscas sem resultado) vêm dos
                logs de acesso, que pela política de privacidade (LGPD) só podem ser lidos por administradores.
              </Aviso>
            </div>
          )}
        </div>
      )}
    </>
  )
}
