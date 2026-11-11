// Regras de negócio de RH em funções PURAS (sem acesso a dados): aposentadoria,
// alerta de risco por unidade, busca de talentos, privacidade em relatórios e
// "ficha atualizada há X meses". Valem para qualquer provedor (local, Firebase, SharePoint).
// Os parâmetros ficam em src/config/regrasRH.ts.

import {
  ALERTA_RISCO,
  GRUPO_MINIMO_PRIVACIDADE,
  HORIZONTE_APOSENTADORIA_ANOS,
  MESES_FICHA_DESATUALIZADA,
  REGRA_APOSENTADORIA,
} from '../config/regrasRH'
import type { Lotacao, Servidor } from '../types'
import { contemTermos, hojeISO, normalizar } from './texto'

// ---------------------------------------------------------------------------
// Datas (AAAA-MM-DD)
// ---------------------------------------------------------------------------
const DIA_MS = 86400000
const paraData = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`)

export function somarAnos(iso: string, anos: number): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  const dia = m === 2 && d === 29 ? 28 : d
  return `${a + Math.trunc(anos)}-${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Anos (com fração) entre duas datas. */
export function anosEntre(inicio: string, fim: string): number {
  return (paraData(fim).getTime() - paraData(inicio).getTime()) / (365.2425 * DIA_MS)
}

export function mesesDesde(iso: string, hoje = hojeISO()): number {
  const a = paraData(iso)
  const b = paraData(hoje)
  return Math.max(0, (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth() - (b.getUTCDate() < a.getUTCDate() ? 1 : 0))
}

/** "Ficha atualizada há X meses". */
export function textoAtualizacao(iso: string, hoje = hojeISO()) {
  const meses = mesesDesde(iso, hoje)
  const texto = meses === 0 ? 'Ficha atualizada este mês' : `Ficha atualizada há ${meses} ${meses === 1 ? 'mês' : 'meses'}`
  return { meses, texto, desatualizada: meses >= MESES_FICHA_DESATUALIZADA }
}

/** Formata anos com fração como "12 anos e 4 meses". */
export function formatarDuracao(anos: number): string {
  const totalMeses = Math.max(0, Math.floor(anos * 12))
  const a = Math.floor(totalMeses / 12)
  const m = totalMeses % 12
  const pa = a === 1 ? '1 ano' : `${a} anos`
  if (m === 0) return pa
  return `${a ? `${pa} e ` : ''}${m === 1 ? '1 mês' : `${m} meses`}`
}

// ---------------------------------------------------------------------------
// Aposentadoria (regra simplificada e configurável)
// ---------------------------------------------------------------------------
export interface PrevisaoAposentadoria {
  idade: number
  /** Anos de serviço, incluindo tempo averbado. */
  anosServico: number
  /** Anos desde o ingresso na PRF (tempo de casa). */
  anosDeCasa: number
  dataPorIdade: string
  dataPorTempo: string
  /** Data em que cumpre os dois requisitos. */
  dataPrevista: string
  jaCumpre: boolean
  anosRestantes: number
  /** Previsão dentro do horizonte de alerta (ou já cumpre). */
  proxima: boolean
}

export function calcularAposentadoria(s: Pick<Servidor, 'dataNascimento' | 'dataIngresso' | 'tempoAverbadoAnos'>, hoje = hojeISO()): PrevisaoAposentadoria {
  const averbado = s.tempoAverbadoAnos ?? 0
  const dataPorIdade = somarAnos(s.dataNascimento, REGRA_APOSENTADORIA.idadeMinima)
  const dataPorTempo = somarAnos(s.dataIngresso, REGRA_APOSENTADORIA.tempoServicoMinimoAnos - averbado)
  const dataPrevista = dataPorIdade > dataPorTempo ? dataPorIdade : dataPorTempo
  const jaCumpre = dataPrevista <= hoje
  return {
    idade: Math.floor(anosEntre(s.dataNascimento, hoje)),
    anosServico: anosEntre(s.dataIngresso, hoje) + averbado,
    anosDeCasa: anosEntre(s.dataIngresso, hoje),
    dataPorIdade,
    dataPorTempo,
    dataPrevista,
    jaCumpre,
    anosRestantes: jaCumpre ? 0 : anosEntre(hoje, dataPrevista),
    proxima: dataPrevista <= somarAnos(hoje, HORIZONTE_APOSENTADORIA_ANOS),
  }
}

const ativos = (lista: Servidor[]) => lista.filter((s) => s.situacao !== 'aposentado')

// ---------------------------------------------------------------------------
// Alerta de risco por unidade
// ---------------------------------------------------------------------------
export type NivelRisco = 'verde' | 'amarelo' | 'vermelho'

export interface AlertaUnidade {
  unidade: Lotacao
  nivel: NivelRisco
  totalServidores: number
  aposentandoNoHorizonte: number
  percentual: number
  /** Competências cujos TODOS os detentores na unidade têm aposentadoria prevista no horizonte. */
  competenciasEmRisco: { nome: string; rara: boolean }[]
  motivos: string[]
}

/** Quantas pessoas têm cada competência em toda a Superintendência. */
export function contarCompetencias(servidores: Servidor[]): Map<string, number> {
  const mapa = new Map<string, number>()
  ativos(servidores).forEach((s) => s.competencias.forEach((c) => mapa.set(c, (mapa.get(c) ?? 0) + 1)))
  return mapa
}

/**
 * Cruza previsão de aposentadoria com competências.
 * `servidores`: as fichas consideradas (o RH / Gestão vê todas as unidades).
 * `contagemGlobal`: quantas pessoas têm cada competência em TODA a Superintendência
 * (número agregado, sem nomes) — é o que define se uma competência é rara.
 */
export function calcularAlertas(
  servidores: Servidor[],
  unidades: readonly Lotacao[],
  contagemGlobal: Record<string, number> = Object.fromEntries(contarCompetencias(servidores)),
  hoje = hojeISO(),
): AlertaUnidade[] {
  return unidades.map((unidade) => {
    const membros = ativos(servidores).filter((s) => s.lotacao === unidade)
    const saindo = new Set(membros.filter((s) => calcularAposentadoria(s, hoje).proxima).map((s) => s.id))
    const percentual = membros.length ? saindo.size / membros.length : 0

    const competencias = new Set(membros.flatMap((s) => s.competencias))
    const competenciasEmRisco = [...competencias]
      .filter((c) => membros.filter((s) => s.competencias.includes(c)).every((s) => saindo.has(s.id)))
      .map((nome) => ({ nome, rara: (contagemGlobal[nome] ?? 0) <= ALERTA_RISCO.raridadeMaxPessoas }))
      .sort((a, b) => Number(b.rara) - Number(a.rara) || a.nome.localeCompare(b.nome, 'pt-BR'))

    const raras = competenciasEmRisco.filter((c) => c.rara)
    const nivel: NivelRisco =
      raras.length > 0 || percentual >= ALERTA_RISCO.percentualVermelho
        ? 'vermelho'
        : percentual >= ALERTA_RISCO.percentualAmarelo || competenciasEmRisco.length > 0
          ? 'amarelo'
          : 'verde'

    const motivos: string[] = []
    if (saindo.size > 0)
      motivos.push(`${descreverParcela(saindo.size, membros.length)} com aposentadoria prevista em até ${HORIZONTE_APOSENTADORIA_ANOS} anos.`)
    raras.forEach((c) => motivos.push(`Competência rara em risco: ${c.nome} (só existe nesta unidade em quem está perto de se aposentar).`))
    competenciasEmRisco.filter((c) => !c.rara).forEach((c) => motivos.push(`A unidade pode ficar sem: ${c.nome}.`))
    if (motivos.length === 0) motivos.push('Sem perdas relevantes previstas no horizonte.')

    return { unidade, nivel, totalServidores: membros.length, aposentandoNoHorizonte: saindo.size, percentual, competenciasEmRisco, motivos }
  })
}

// ---------------------------------------------------------------------------
// Busca de talentos (filtros combinados)
// ---------------------------------------------------------------------------
export interface FiltrosTalento {
  /** Curso ou competência (busca tolerante a acentos). */
  termo?: string
  /** Tempo de casa mínimo, em anos. */
  anosMinimos?: number
  unidade?: Lotacao
  indicacao?: string
}

export interface ResultadoTalento {
  servidor: Servidor
  anosDeCasa: number
  /** Cursos/competências que corresponderam ao termo. */
  correspondencias: string[]
}

export function buscarTalentos(servidores: Servidor[], f: FiltrosTalento, hoje = hojeISO()): ResultadoTalento[] {
  const termo = f.termo?.trim() ?? ''
  return ativos(servidores)
    .map((servidor) => {
      const anosDeCasa = anosEntre(servidor.dataIngresso, hoje)
      const itens = [...servidor.competencias, ...servidor.capacitacoes.map((c) => c.nome)]
      const correspondencias = termo ? [...new Set(itens.filter((i) => contemTermos(termo, i)))] : []
      return { servidor, anosDeCasa, correspondencias }
    })
    .filter(
      (r) =>
        (!termo || r.correspondencias.length > 0) &&
        (f.anosMinimos === undefined || r.anosDeCasa >= f.anosMinimos) &&
        (!f.unidade || r.servidor.lotacao === f.unidade) &&
        (!f.indicacao || r.servidor.indicacoes.some((i) => normalizar(i) === normalizar(f.indicacao!))),
    )
    .sort((a, b) => b.correspondencias.length - a.correspondencias.length || b.anosDeCasa - a.anosDeCasa)
}

/** Sugestões para o campo de busca de talentos: todas as competências e cursos conhecidos. */
export function opcoesDeTalento(servidores: Servidor[]): string[] {
  const set = new Set<string>()
  servidores.forEach((s) => {
    s.competencias.forEach((c) => set.add(c))
    s.capacitacoes.forEach((c) => set.add(c.nome))
  })
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

// ---------------------------------------------------------------------------
// Privacidade em relatórios agregados (LGPD)
// ---------------------------------------------------------------------------
export const MSG_DADOS_INSUFICIENTES = 'Dados insuficientes para preservar a privacidade'

/**
 * Valor de um grupo agregado: `null` quando o grupo tem de 1 a 4 pessoas
 * (exibir "dados insuficientes"). Zero não identifica ninguém e é exibido.
 */
export function valorProtegido(n: number): number | null {
  return n === 0 || n >= GRUPO_MINIMO_PRIVACIDADE ? n : null
}

/**
 * Descreve "quantos de uma equipe" sem expor números de grupos pequenos.
 * Só mostra porcentagem quando a equipe E o grupo afetado têm pelo menos 5 pessoas;
 * caso contrário usa faixas qualitativas.
 */
export function descreverParcela(afetados: number, equipe: number): string {
  if (afetados <= 0 || equipe <= 0) return 'Ninguém da equipe'
  const fracao = afetados / equipe
  if (equipe >= GRUPO_MINIMO_PRIVACIDADE && afetados >= GRUPO_MINIMO_PRIVACIDADE) return `${Math.round(fracao * 100)}% da equipe`
  if (fracao > 0.5) return 'Mais da metade da equipe'
  if (fracao >= ALERTA_RISCO.percentualAmarelo) return 'Parte relevante da equipe'
  return 'Poucos servidores'
}

export interface ListaProtegida {
  /** Valor de cada grupo, ou `null` quando ocultado (primária ou complementar). */
  valores: (number | null)[]
  /** Total da lista, ou `null` quando precisou ser ocultado. */
  total: number | null
}

/**
 * Proteção de uma lista agregada com total conhecido (LGPD):
 * 1) supressão PRIMÁRIA: grupos de 1 a 4 pessoas ficam ocultos;
 * 2) supressão COMPLEMENTAR: se o que ficou oculto puder ser descoberto por subtração
 *    (um único valor oculto, ou ocultos que somam menos de 5), oculta também o menor valor
 *    visível não nulo — e, se não houver nenhum, oculta o total.
 * Sem `total` (ex.: categorias que se sobrepõem, cuja soma não é exibida), aplica só a primária.
 */
export function protegerLista(valores: number[], total?: number): ListaProtegida {
  const saida = valores.map(valorProtegido)
  if (total === undefined) return { valores: saida, total: null }
  let totalVisivel: number | null = valorProtegido(total)
  // Total oculto: não há como descobrir nada por subtração.
  while (totalVisivel !== null) {
    const ocultos = valores.map((v, i) => ({ v, i })).filter(({ v, i }) => saida[i] === null && v > 0)
    if (ocultos.length === 0) break
    const somaOculta = ocultos.reduce((s, o) => s + o.v, 0)
    if (ocultos.length >= 2 && somaOculta >= GRUPO_MINIMO_PRIVACIDADE) break
    const candidatos = valores
      .map((v, i) => ({ v, i }))
      .filter(({ v, i }) => saida[i] !== null && v > 0)
      .sort((a, b) => a.v - b.v)
    if (candidatos.length === 0) {
      totalVisivel = null
      break
    }
    saida[candidatos[0].i] = null
  }
  return { valores: saida, total: totalVisivel }
}
