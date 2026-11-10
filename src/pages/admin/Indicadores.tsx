import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Carregando, MensagemErro } from '../../components/Estados'
import { CabecalhoPagina, Cartao } from '../../components/painel/ui'
import { GRUPO_MINIMO_PRIVACIDADE, HORIZONTE_APOSENTADORIA_ANOS } from '../../config/regrasRH'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { calcularAlertas, calcularAposentadoria, MSG_DADOS_INSUFICIENTES, protegerLista, textoAtualizacao, valorProtegido, type AlertaUnidade, type NivelRisco } from '../../lib/rh'
import { servicos } from '../../services'
import { AREAS_CAPACITACAO, LOTACOES, type Lotacao } from '../../types'

const COR_BARRA = '#17387a'

interface Linha {
  rotulo: string
  /** Já protegido por `protegerLista` (null = oculto). */
  valor: number | null
}

/** Monta as linhas de uma lista aplicando a proteção (primária + complementar) de src/lib/rh.ts. */
function protegerLinhas(linhas: { rotulo: string; valor: number }[], total?: number): { linhas: Linha[]; total: number | null } {
  const p = protegerLista(linhas.map((l) => l.valor), total)
  return { linhas: linhas.map((l, i) => ({ rotulo: l.rotulo, valor: p.valores[i] })), total: p.total }
}

/** Barras horizontais com proteção de privacidade: grupos pequenos (e os complementares) não são exibidos. */
function BarrasProtegidas({ titulo, descricao, linhas }: { titulo: string; descricao?: string; linhas: Linha[] }) {
  const max = Math.max(1, ...linhas.map((l) => l.valor ?? 0))
  return (
    <Cartao>
      <h2 className="font-bold text-marinho-900">{titulo}</h2>
      {descricao && <p className="mb-3 text-xs text-marinho-700">{descricao}</p>}
      <ul className="mt-3 flex flex-col gap-2.5">
        {linhas.map((l) => {
          const v = l.valor
          return (
            <li key={l.rotulo} className="grid grid-cols-[9.5rem_1fr] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr]">
              <span className="truncate text-marinho-900" title={l.rotulo}>{l.rotulo}</span>
              {v === null ? (
                <span className="rounded bg-marinho-50 px-2 py-1 text-xs italic text-marinho-700" title={`Oculto para que nenhum grupo com menos de ${GRUPO_MINIMO_PRIVACIDADE} pessoas possa ser identificado`}>
                  {MSG_DADOS_INSUFICIENTES}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="h-4 rounded-r" style={{ width: `${Math.max(v ? 4 : 0, (v / max) * 100)}%`, background: COR_BARRA }} aria-hidden />
                  <span className="font-semibold tabular-nums text-marinho-950">{v}</span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Cartao>
  )
}

/** `valor` já protegido (null = oculto). */
function Numero({ rotulo, valor, Icone, nota }: { rotulo: string; valor: number | null; Icone: LucideIcon; nota?: string }) {
  const v = valor
  return (
    <Cartao className="flex items-start gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-marinho-900 text-destaque-500"><Icone className="size-6" aria-hidden /></span>
      <div>
        <p className="text-sm text-marinho-700">{rotulo}</p>
        {v === null ? <p className="mt-1 text-sm italic text-marinho-700">{MSG_DADOS_INSUFICIENTES}</p> : <p className="text-3xl font-bold tabular-nums text-marinho-950">{v}</p>}
        {nota && <p className="text-xs text-marinho-700">{nota}</p>}
      </div>
    </Cartao>
  )
}

const RISCO: Record<NivelRisco, { rotulo: string; Icone: LucideIcon; cor: string; borda: string }> = {
  vermelho: { rotulo: 'Risco alto', Icone: AlertOctagon, cor: 'bg-red-100 text-red-950 ring-red-300', borda: 'border-red-600' },
  amarelo: { rotulo: 'Atenção', Icone: AlertTriangle, cor: 'bg-amber-100 text-amber-950 ring-amber-400', borda: 'border-amber-500' },
  verde: { rotulo: 'Estável', Icone: CheckCircle2, cor: 'bg-emerald-100 text-emerald-950 ring-emerald-300', borda: 'border-emerald-600' },
}

function CardAlerta({ a }: { a: AlertaUnidade }) {
  const r = RISCO[a.nivel]
  return (
    <li className={`rounded-xl border-l-8 bg-white p-4 shadow-sm ring-1 ring-marinho-100 ${r.borda}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-marinho-900">{a.unidade}</h3>
        {/* Status sempre com ícone + texto, nunca só a cor. */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${r.cor}`}>
          <r.Icone className="size-3.5" aria-hidden /> {r.rotulo}
        </span>
      </div>
      <ul className="flex flex-col gap-1 text-sm text-marinho-900">
        {a.motivos.map((m) => <li key={m}>• {m}</li>)}
      </ul>
    </li>
  )
}

/** Painel de indicadores de pessoal + alerta de risco por unidade (proposta, seções "Painel" e "Diferenciais"). */
export default function Indicadores() {
  const ctx = useContextoAcesso('painel')
  const gestor = ctx.usuario.perfil === 'gestor'
  const unidades: readonly Lotacao[] = gestor ? [ctx.usuario.unidade] : LOTACOES

  const { dados, carregando, erro } = useCarregar(async () => {
    const [servidores, contagem] = await Promise.all([servicos.servidores.listar(ctx), servicos.servidores.contagemCompetencias(ctx)])
    return { servidores: servidores.filter((s) => s.situacao !== 'aposentado'), contagem }
  }, [ctx])

  const r = useMemo(() => {
    if (!dados) return null
    const { servidores, contagem } = dados
    const ap = new Map(servidores.map((s) => [s.id, calcularAposentadoria(s)]))
    const proximos = servidores.filter((s) => ap.get(s.id)!.proxima)

    // Listas cujo total aparece no topo: proteção primária + complementar (src/lib/rh.ts).
    const porUnidade = protegerLinhas(unidades.map((u) => ({ rotulo: u, valor: servidores.filter((s) => s.lotacao === u).length })), servidores.length)
    const aposPorUnidade = protegerLinhas(unidades.map((u) => ({ rotulo: u, valor: proximos.filter((s) => s.lotacao === u).length })), proximos.length)
    const aposPorFaixa = protegerLinhas(
      [
        { rotulo: 'Já cumprem os requisitos', valor: proximos.filter((s) => ap.get(s.id)!.jaCumpre).length },
        { rotulo: 'Em até 2 anos', valor: proximos.filter((s) => !ap.get(s.id)!.jaCumpre && ap.get(s.id)!.anosRestantes <= 2).length },
        { rotulo: `De 2 a ${HORIZONTE_APOSENTADORIA_ANOS} anos`, valor: proximos.filter((s) => ap.get(s.id)!.anosRestantes > 2).length },
      ],
      proximos.length,
    )
    // O mesmo total aparece em duas listas: se qualquer uma precisar ocultá-lo, ele some do topo.
    const totalProximos = aposPorUnidade.total === null || aposPorFaixa.total === null ? null : aposPorUnidade.total

    return {
      total: porUnidade.total,
      proximos: totalProximos,
      desatualizadas: valorProtegido(servidores.filter((s) => textoAtualizacao(s.fichaAtualizadaEm).desatualizada).length),
      porUnidade: porUnidade.linhas,
      aposPorUnidade: aposPorUnidade.linhas,
      aposPorFaixa: aposPorFaixa.linhas,
      // Áreas se sobrepõem (um servidor pode ter cursos em várias) e não há total exibido: só a proteção primária.
      porArea: protegerLinhas(AREAS_CAPACITACAO.map((a) => ({ rotulo: a, valor: servidores.filter((s) => s.capacitacoes.some((c) => c.area === a)).length }))).linhas,
      alertas: calcularAlertas(servidores, unidades, contagem).sort((a, b) => ['vermelho', 'amarelo', 'verde'].indexOf(a.nivel) - ['vermelho', 'amarelo', 'verde'].indexOf(b.nivel)),
    }
  }, [dados, unidades])

  return (
    <>
      <CabecalhoPagina titulo="Indicadores de pessoal"
        descricao={gestor ? `Unidade: ${ctx.usuario.unidade}` : 'Toda a Superintendência · números prontos, sem montagem manual'} />
      {carregando && <Carregando texto="Calculando indicadores…" />}
      {erro && <MensagemErro>{erro}</MensagemErro>}
      {r && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Numero rotulo="Servidores" valor={r.total} Icone={Users} />
            <Numero rotulo={`Próximos da aposentadoria (${HORIZONTE_APOSENTADORIA_ANOS} anos)`} valor={r.proximos} Icone={AlertTriangle} nota="Inclui quem já cumpre os requisitos." />
            <Numero rotulo="Fichas desatualizadas (> 12 meses)" valor={r.desatualizadas} Icone={ShieldCheck} />
          </div>

          <section aria-labelledby="titulo-alertas">
            <h2 id="titulo-alertas" className="mb-1 text-lg font-bold text-marinho-900">Alerta de risco por unidade</h2>
            <p className="mb-3 text-xs text-marinho-700">
              Cruza a previsão de aposentadoria (até {HORIZONTE_APOSENTADORIA_ANOS} anos) com as competências de cada unidade. Vermelho: a unidade pode perder uma competência rara ou metade da equipe. Amarelo: perda relevante de pessoas ou de alguma competência.
            </p>
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">{r.alertas.map((a) => <CardAlerta key={a.unidade} a={a} />)}</ul>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <BarrasProtegidas titulo="Servidores por unidade" linhas={r.porUnidade} />
            <BarrasProtegidas titulo={`Próximos da aposentadoria por unidade (${HORIZONTE_APOSENTADORIA_ANOS} anos)`} linhas={r.aposPorUnidade} />
            <BarrasProtegidas titulo="Próximos da aposentadoria por prazo" linhas={r.aposPorFaixa} />
            <BarrasProtegidas titulo="Capacitações por área" descricao="Servidores com pelo menos um curso na área." linhas={r.porArea} />
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-marinho-50 p-3 text-xs text-marinho-900">
            <ShieldCheck className="size-4 shrink-0" aria-hidden />
            LGPD: números de grupos com 1 a {GRUPO_MINIMO_PRIVACIDADE - 1} pessoas não são exibidos, e outros valores (ou o total) também são ocultados quando seria possível descobri-los por subtração. Os alertas usam faixas qualitativas em vez de números.
            Previsões de aposentadoria são estimativas pela regra simplificada configurada pelo RH.
          </p>
        </div>
      )}
    </>
  )
}
