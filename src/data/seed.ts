// Dados 100% FICTÍCIOS para o protótipo SYNTRA.
// Nomes, matrículas, CPFs, datas e números de processo são inventados. O quadro de
// servidores é definido à mão para o cenário ser coerente (aposentadorias previstas,
// competências raras concentradas em poucas pessoas → alertas de risco); o restante
// usa um gerador pseudoaleatório com semente fixa (mesmos dados a cada execução).
// Este arquivo só importa TIPOS, para poder ser usado também pelo script Node de seed.

import type {
  AreaCapacitacao,
  Capacitacao,
  Documento,
  Extrato,
  LogAcesso,
  Lotacao,
  Movimentacao,
  MovimentacaoLotacao,
  NivelAcesso,
  Processo,
  Servidor,
  SituacaoProcesso,
  SituacaoServidor,
  Solicitacao,
  StatusDocumento,
  TipoDocumento,
  Usuario,
} from '../types'


function mulberry32(semente: number) {
  let a = semente
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const p2 = (n: number) => String(n).padStart(2, '0')
const isoDia = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`

// ---------------------------------------------------------------------------
// Contas de demonstração (também listadas no README): uma para cada perfil,
// todas com o nome "Camila" (o cabeçalho mostra o perfil ao lado do nome).
// ---------------------------------------------------------------------------
export const SENHA_DEMO = 'syntra123'

export const CONTAS_DEMO: Usuario[] = [
  { uid: 'demo-servidor', nome: 'Camila', matricula: '1001', perfil: 'servidor', unidade: 'Delegacia de Teresina' },
  { uid: 'demo-gestor', nome: 'Camila', matricula: '1002', perfil: 'gestor', unidade: 'Delegacia de Parnaíba' },
  { uid: 'demo-rh', nome: 'Camila', matricula: '1003', perfil: 'admin', unidade: 'Superintendência – Teresina' },
]

// ---------------------------------------------------------------------------
// Competências e cursos
// ---------------------------------------------------------------------------
/** Competência → curso que a comprova (quando existe). */
const CURSO_DA_COMPETENCIA: Record<string, { nome: string; area: AreaCapacitacao; ch: number; inst: string }> = {
  'Perícia em acidentes de trânsito': { nome: 'Perícia em Acidentes de Trânsito', area: 'Operacional', ch: 120, inst: 'Academia Nacional da PRF' },
  'Fiscalização de produtos perigosos': { nome: 'Fiscalização de Produtos Perigosos', area: 'Operacional', ch: 60, inst: 'Academia Nacional da PRF' },
  'Operação de drones (RPA)': { nome: 'Pilotagem de Aeronaves Remotamente Pilotadas (RPA)', area: 'Tecnologia', ch: 80, inst: 'UniPRF (EAD)' },
  Libras: { nome: 'Libras – Língua Brasileira de Sinais', area: 'Atendimento', ch: 60, inst: 'SENAI-PI' },
  'Gestão de contratos': { nome: 'Gestão e Fiscalização de Contratos', area: 'Gestão', ch: 40, inst: 'ENAP' },
  'Inteligência policial': { nome: 'Inteligência Policial Básica', area: 'Operacional', ch: 60, inst: 'Academia Nacional da PRF' },
  'Instrutor de armamento e tiro': { nome: 'Formação de Instrutores de Armamento e Tiro', area: 'Operacional', ch: 80, inst: 'Academia Nacional da PRF' },
  Motopoliciamento: { nome: 'Curso de Motopoliciamento', area: 'Operacional', ch: 100, inst: 'Academia Nacional da PRF' },
  'Primeiros socorros': { nome: 'Atendimento Pré-Hospitalar (APH)', area: 'Saúde e segurança', ch: 40, inst: 'Corpo de Bombeiros Militar do PI' },
  'Atendimento a acidentes': { nome: 'Atendimento a Sinistros de Trânsito', area: 'Operacional', ch: 40, inst: 'UniPRF (EAD)' },
  'Direção defensiva': { nome: 'Direção Defensiva e Evasiva', area: 'Operacional', ch: 40, inst: 'Academia Nacional da PRF' },
  'Gestão de pessoas': { nome: 'Liderança e Gestão de Equipes', area: 'Gestão', ch: 30, inst: 'ENAP' },
  'Planilhas e análise de dados': { nome: 'Excel Avançado e Análise de Dados', area: 'Tecnologia', ch: 20, inst: 'ENAP' },
  'Redação oficial': { nome: 'Redação Oficial', area: 'Gestão', ch: 20, inst: 'ENAP' },
  'Atendimento ao público': { nome: 'Atendimento ao Cidadão', area: 'Atendimento', ch: 16, inst: 'ENAP' },
}
const CURSO_LGPD = { nome: 'LGPD no Serviço Público', area: 'Jurídica' as const, ch: 20, inst: 'ENAP' }

// ---------------------------------------------------------------------------
// Quadro de 30 servidores (desenhado para gerar o cenário de demonstração)
// Regra simplificada (src/config/regrasRH.ts): 55 anos de idade + 30 de serviço.
//   Parnaíba: 3 de 5 perto da aposentadoria + competências raras → VERMELHO
//   Corrente: única pessoa com Libras na unidade perto da aposentadoria → VERMELHO
//   Superintendência (3 de 8) e Picos (1 de 4, perde competências) → AMARELO
//   Teresina e Floriano → VERDE
// ---------------------------------------------------------------------------
const PRF = 'Policial Rodoviário Federal'
const AGENTE = 'Agente Administrativo'
const ANALISTA = 'Analista Técnico-Administrativo'
const TAE = 'Técnico em Assuntos Educacionais'

interface Linha {
  nome: string
  lotacao: Lotacao
  cargo: string
  nasc: number
  ingresso: number
  comp: string[]
  ind?: string[]
  averbado?: number
  situacao?: SituacaoServidor
  /** Unidades anteriores (mais antiga primeiro). */
  antes?: Lotacao[]
}

const QUADRO: Linha[] = [
  // 1001–1003: contas de demonstração "Camila"
  { nome: 'Camila', lotacao: 'Delegacia de Teresina', cargo: PRF, nasc: 1988, ingresso: 2014, comp: ['Fiscalização de trânsito', 'Primeiros socorros'], ind: ['Projetos'], antes: ['Delegacia de Picos'] },
  { nome: 'Camila', lotacao: 'Delegacia de Parnaíba', cargo: PRF, nasc: 1979, ingresso: 2005, comp: ['Gestão de pessoas', 'Fiscalização de trânsito', 'Atendimento a acidentes'], ind: ['Liderança'], antes: ['Delegacia de Floriano', 'Delegacia de Teresina'] },
  { nome: 'Camila', lotacao: 'Superintendência – Teresina', cargo: ANALISTA, nasc: 1983, ingresso: 2009, comp: ['Gestão de pessoas', 'Planilhas e análise de dados', 'Redação oficial'], ind: ['Liderança', 'Projetos'] },
  // Superintendência (8 no total)
  { nome: 'Heitor Nogueira Barros', lotacao: 'Superintendência – Teresina', cargo: AGENTE, nasc: 1966, ingresso: 1990, comp: ['Gestão de contratos', 'Redação oficial'], ind: ['Mentoria'] },
  { nome: 'Beatriz Sampaio Holanda', lotacao: 'Superintendência – Teresina', cargo: ANALISTA, nasc: 1975, ingresso: 2002, comp: ['Gestão de contratos', 'Planilhas e análise de dados'] },
  { nome: 'Otávio Pacheco Lacerda', lotacao: 'Superintendência – Teresina', cargo: PRF, nasc: 1970, ingresso: 1996, comp: ['Inteligência policial', 'Fiscalização de trânsito'], ind: ['Mentoria'], antes: ['Delegacia de Parnaíba'] },
  { nome: 'Isadora Teixeira Brandão', lotacao: 'Superintendência – Teresina', cargo: PRF, nasc: 1990, ingresso: 2016, comp: ['Operação de drones (RPA)', 'Inteligência policial', 'Planilhas e análise de dados'], ind: ['Projetos'] },
  { nome: 'Rafael Coutinho Esteves', lotacao: 'Superintendência – Teresina', cargo: PRF, nasc: 1985, ingresso: 2010, comp: ['Instrutor de armamento e tiro', 'Fiscalização de trânsito'], ind: ['Instrutoria', 'Liderança'], antes: ['Delegacia de Corrente'] },
  { nome: 'Natália Freitas Macedo', lotacao: 'Superintendência – Teresina', cargo: TAE, nasc: 1978, ingresso: 2006, comp: ['Atendimento ao público', 'Redação oficial'], ind: ['Instrutoria'] },
  { nome: 'Gustavo Albuquerque Rocha', lotacao: 'Superintendência – Teresina', cargo: AGENTE, nasc: 1968, ingresso: 1994, comp: ['Redação oficial', 'Atendimento ao público'] },
  // Delegacia de Teresina (6 no total, com a Camila 1001)
  { nome: 'Davi Holanda Quaresma', lotacao: 'Delegacia de Teresina', cargo: PRF, nasc: 1992, ingresso: 2018, comp: ['Motopoliciamento', 'Fiscalização de trânsito'] },
  { nome: 'Larissa Junqueira Falcão', lotacao: 'Delegacia de Teresina', cargo: PRF, nasc: 1987, ingresso: 2012, comp: ['Libras', 'Atendimento a acidentes', 'Primeiros socorros'], ind: ['Mentoria'], antes: ['Delegacia de Floriano'] },
  { nome: 'Tiago Damasceno Rocha', lotacao: 'Delegacia de Teresina', cargo: PRF, nasc: 1980, ingresso: 2008, comp: ['Atendimento a acidentes', 'Direção defensiva'], ind: ['Instrutoria'] },
  { nome: 'Yasmin Vasconcelos Lima', lotacao: 'Delegacia de Teresina', cargo: AGENTE, nasc: 1995, ingresso: 2021, comp: ['Atendimento ao público', 'Planilhas e análise de dados'] },
  { nome: 'Bruno Esteves Gouveia', lotacao: 'Delegacia de Teresina', cargo: PRF, nasc: 1974, ingresso: 2003, comp: ['Fiscalização de trânsito', 'Direção defensiva'], antes: ['Delegacia de Picos'] },
  // Delegacia de Parnaíba (5 no total, com a Camila 1002)
  { nome: 'Joaquim Ibiapina Cavalcante', lotacao: 'Delegacia de Parnaíba', cargo: PRF, nasc: 1967, ingresso: 1993, comp: ['Perícia em acidentes de trânsito', 'Atendimento a acidentes'], ind: ['Mentoria'] },
  { nome: 'Valéria Nogueira Xavier', lotacao: 'Delegacia de Parnaíba', cargo: PRF, nasc: 1969, ingresso: 1995, comp: ['Fiscalização de produtos perigosos', 'Fiscalização de trânsito'], antes: ['Superintendência – Teresina'] },
  { nome: 'Wesley Barros Sampaio', lotacao: 'Delegacia de Parnaíba', cargo: PRF, nasc: 1993, ingresso: 2019, comp: ['Fiscalização de trânsito', 'Primeiros socorros'] },
  { nome: 'Fernanda Lacerda Rocha', lotacao: 'Delegacia de Parnaíba', cargo: AGENTE, nasc: 1972, ingresso: 1999, averbado: 3, comp: ['Atendimento ao público', 'Redação oficial'] },
  // Delegacia de Picos (4)
  { nome: 'Diego Uchôa Freitas', lotacao: 'Delegacia de Picos', cargo: PRF, nasc: 1971, ingresso: 1998, comp: ['Direção defensiva', 'Atendimento a acidentes'], ind: ['Instrutoria'] },
  { nome: 'Elisa Macedo Pacheco', lotacao: 'Delegacia de Picos', cargo: PRF, nasc: 1989, ingresso: 2015, comp: ['Fiscalização de trânsito', 'Primeiros socorros'], ind: ['Liderança'] },
  { nome: 'Matheus Coutinho Albuquerque', lotacao: 'Delegacia de Picos', cargo: PRF, nasc: 1991, ingresso: 2017, comp: ['Fiscalização de trânsito', 'Motopoliciamento'] },
  { nome: 'Sabrina Zanetti Gouveia', lotacao: 'Delegacia de Picos', cargo: AGENTE, nasc: 1986, ingresso: 2013, comp: ['Atendimento ao público', 'Planilhas e análise de dados'], situacao: 'cedido' },
  // Delegacia de Floriano (4)
  { nome: 'Leandro Rocha Damasceno', lotacao: 'Delegacia de Floriano', cargo: PRF, nasc: 1984, ingresso: 2011, comp: ['Fiscalização de trânsito', 'Instrutor de armamento e tiro'], ind: ['Instrutoria'] },
  { nome: 'Paula Esteves Junqueira', lotacao: 'Delegacia de Floriano', cargo: PRF, nasc: 1990, ingresso: 2016, comp: ['Primeiros socorros', 'Atendimento a acidentes'], ind: ['Liderança'] },
  { nome: 'Fábio Quaresma Teixeira', lotacao: 'Delegacia de Floriano', cargo: TAE, nasc: 1982, ingresso: 2010, comp: ['Atendimento ao público', 'Redação oficial'], situacao: 'licença' },
  { nome: 'Juliana Brandão Nogueira', lotacao: 'Delegacia de Floriano', cargo: PRF, nasc: 1994, ingresso: 2020, comp: ['Fiscalização de trânsito', 'Direção defensiva'] },
  // Delegacia de Corrente (3)
  { nome: 'Arthur Falcão Holanda', lotacao: 'Delegacia de Corrente', cargo: PRF, nasc: 1968, ingresso: 1995, comp: ['Libras', 'Fiscalização de trânsito'], ind: ['Mentoria'], antes: ['Delegacia de Floriano'] },
  { nome: 'Giovana Cavalcante Vasconcelos', lotacao: 'Delegacia de Corrente', cargo: PRF, nasc: 1992, ingresso: 2019, comp: ['Fiscalização de trânsito', 'Primeiros socorros'] },
  { nome: 'Renato Siqueira Lima', lotacao: 'Delegacia de Corrente', cargo: AGENTE, nasc: 1975, ingresso: 2003, comp: ['Atendimento ao público', 'Planilhas e análise de dados'] },
]

const TITULOS: Record<TipoDocumento, string[]> = {
  Portaria: ['Designação para função gratificada', 'Dispensa de função', 'Remoção a pedido', 'Lotação provisória'],
  Ofício: ['Encaminhamento de documentação funcional', 'Solicitação de informações funcionais', 'Resposta a requerimento'],
  Requerimento: ['Requerimento de horário especial', 'Requerimento de ressarcimento', 'Requerimento de certidão funcional'],
  Férias: ['Programação de férias', 'Alteração de período de férias', 'Interrupção de férias'],
  Licença: ['Licença para tratamento de saúde', 'Licença para capacitação', 'Licença por motivo de doença em pessoa da família'],
  Progressão: ['Progressão funcional por tempo de serviço', 'Promoção de classe', 'Avaliação de desempenho para progressão'],
  'Averbação de Tempo': ['Averbação de tempo de serviço anterior', 'Averbação de tempo de contribuição (INSS)'],
  Capacitação: ['Certificado de curso de capacitação', 'Inscrição em curso de aperfeiçoamento', 'Comprovação de horas de treinamento'],
  'Ficha Funcional': ['Ficha funcional atualizada', 'Assentamento funcional'],
  Outros: ['Declaração de bens e rendas', 'Termo de posse', 'Atualização cadastral'],
}
const PALAVRAS: Record<TipoDocumento, string[]> = {
  Portaria: ['portaria', 'designação', 'função'],
  Ofício: ['ofício', 'comunicação'],
  Requerimento: ['requerimento', 'pedido'],
  Férias: ['férias', 'escala'],
  Licença: ['licença', 'afastamento'],
  Progressão: ['progressão', 'carreira', 'promoção'],
  'Averbação de Tempo': ['averbação', 'tempo de serviço', 'aposentadoria'],
  Capacitação: ['capacitação', 'curso', 'treinamento'],
  'Ficha Funcional': ['ficha funcional', 'assentamento', 'cadastro'],
  Outros: ['diversos'],
}
const TIPOS: TipoDocumento[] = Object.keys(TITULOS) as TipoDocumento[]

const ASSUNTOS = [
  'Concessão de progressão funcional',
  'Averbação de tempo de serviço',
  'Programação de férias anuais',
  'Licença para capacitação',
  'Remoção a pedido',
  'Atualização de assentamento funcional',
  'Concessão de horário especial',
  'Abono de permanência',
]
const UNIDADES_SEI = ['SPRF-PI/NGP', 'SPRF-PI/SEPLAN', 'SPRF-PI/GAB', 'SPRF-PI/NGP/Arquivo', 'DPRF/CGRH', 'SPRF-PI/CORREG']

export interface DadosSeed {
  servidores: Servidor[]
  documentos: Documento[]
  processos: Processo[]
  usuarios: Usuario[]
  logs: LogAcesso[]
  solicitacoes: Solicitacao[]
  /** Extratos emitidos no totem (começa vazio). */
  extratos: Extrato[]
}

/** Gera o acervo fictício. `agora` ancora as datas recentes (cadastros do mês, logs, fichas). */
export function gerarSeed(agora: Date = new Date()): DadosSeed {
  const r = mulberry32(20261110)
  const int = (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]
  const diaDoAno = (ano: number) => `${ano}-${p2(int(1, 12))}-${p2(int(1, 28))}`
  const mesesAtras = (m: number) => {
    const d = new Date(agora)
    d.setMonth(d.getMonth() - m)
    d.setDate(Math.min(d.getDate(), 28))
    return isoDia(d)
  }
  const diasAtras = (n: number) => new Date(agora.getTime() - n * 86400000).toISOString()

  // ---------------- Servidores (30) ----------------
  const emailsUsados = new Set<string>()
  const servidores: Servidor[] = QUADRO.map((l, i) => {
    const matricula = String(1001 + i)
    const partes = l.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(' ')
    let base = partes.length > 1 ? `${partes[0]}.${partes[partes.length - 1]}` : `${partes[0]}.${matricula}`
    if (emailsUsados.has(base)) base = `${base}.${matricula}`
    emailsUsados.add(base)

    const dataNascimento = diaDoAno(l.nasc)
    const dataIngresso = diaDoAno(l.ingresso)

    // Bloco 2: histórico de lotações (ingresso → remoções → lotação atual).
    const unidades = [...(l.antes ?? []), l.lotacao]
    const historicoLotacoes: MovimentacaoLotacao[] = []
    let inicio = dataIngresso
    const anoAtual = agora.getFullYear()
    unidades.forEach((unidade, k) => {
      const ultima = k === unidades.length - 1
      const anoFim = ultima ? null : Math.min(anoAtual - 1, l.ingresso + Math.round(((anoAtual - l.ingresso) * (k + 1)) / unidades.length))
      const fim = anoFim ? diaDoAno(anoFim) : null
      historicoLotacoes.push({
        unidade,
        inicio,
        fim,
        motivo: k === 0 ? 'Ingresso (posse)' : pick(['Remoção a pedido', 'Remoção de ofício', 'Permuta', 'Remoção por concurso interno']),
      })
      if (fim) inicio = fim
    })

    // Bloco 4: cursos que comprovam as competências + LGPD para parte do quadro.
    const cursos = l.comp.map((c) => CURSO_DA_COMPETENCIA[c]).filter(Boolean)
    if (r() < 0.4) cursos.push(CURSO_LGPD)
    const capacitacoes: Capacitacao[] = cursos.map((c, k) => ({
      id: `cap-${matricula}-${k + 1}`,
      nome: c.nome,
      area: c.area,
      cargaHoraria: c.ch,
      instituicao: c.inst,
      dataConclusao: diaDoAno(int(Math.min(l.ingresso + 1, anoAtual - 1), anoAtual - 1)),
    }))

    return {
      id: `srv-${matricula}`,
      matricula,
      nome: l.nome,
      cargo: l.cargo,
      situacao: l.situacao ?? 'ativo',
      email: `${base}@exemplo.syntra.local`,
      cpfMascarado: `***.${int(100, 999)}.${int(100, 999)}-**`,
      lotacao: l.lotacao,
      historicoLotacoes,
      dataIngresso,
      dataNascimento,
      tempoAverbadoAnos: l.averbado,
      capacitacoes,
      competencias: l.comp,
      indicacoes: l.ind ?? [],
      // Bloco 5 + rotina de atualização: algumas fichas propositalmente desatualizadas (> 12 meses).
      fichaAtualizadaEm: mesesAtras(i === 0 ? 7 : int(1, 20)),
    }
  })

  // ---------------- Processos (40) e Documentos (120) ----------------
  const processos: Processo[] = []
  const documentos: Documento[] = []
  let seqDoc = 1

  for (let i = 0; i < 40; i++) {
    // Os 4 primeiros processos pertencem à conta "servidor" de demonstração (Camila 1001).
    const srv = i < 4 ? servidores[0] : servidores[(i % 29) + 1]
    const ano = int(Math.max(2009, Number(srv.dataIngresso.slice(0, 4)) + 1), 2025)
    const numeroProcesso = `08665.${String(int(1, 999999)).padStart(6, '0')}/${ano}-${p2(int(10, 99))}`
    const situacao: SituacaoProcesso = pick(['Em andamento', 'Concluído', 'Arquivado', 'Arquivado', 'Sobrestado'])

    const historico: Movimentacao[] = []
    let dia = new Date(ano, int(0, 10), int(1, 25))
    const nMov = int(2, 5)
    for (let m = 0; m < nMov; m++) {
      historico.push({
        data: isoDia(dia),
        unidade: m === 0 ? 'SPRF-PI/NGP' : pick(UNIDADES_SEI),
        descricao:
          m === 0
            ? 'Abertura do processo e juntada da documentação inicial'
            : pick([
                'Encaminhado para análise técnica',
                'Despacho de deferimento',
                'Juntada de documento complementar',
                'Solicitada manifestação do servidor',
                'Encaminhado para arquivamento',
                'Publicação em boletim de serviço',
              ]),
      })
      dia = new Date(dia.getTime() + int(5, 90) * 86400000)
    }

    // 3 documentos por processo, com tipos distintos (evita duplicidade).
    const tiposProc = new Set<TipoDocumento>()
    while (tiposProc.size < 3) tiposProc.add(pick(TIPOS))
    if (i === 0) {
      tiposProc.clear()
      ;['Ficha Funcional', 'Capacitação', 'Outros'].forEach((t) => tiposProc.add(t as TipoDocumento))
    }

    const ids: string[] = []
    let k = 0
    for (const tipo of tiposProc) {
      const id = `doc-${String(seqDoc).padStart(4, '0')}`
      const dataDocumento = historico[Math.min(k, historico.length - 1)].data
      const status: StatusDocumento =
        situacao === 'Arquivado' || situacao === 'Concluído' ? (r() < 0.8 ? 'Arquivado' : 'Ativo') : r() < 0.6 ? 'Em tramitação' : 'Ativo'
      const sorteio = r()
      let nivelAcesso: NivelAcesso = sorteio < 0.45 ? 'publico-interno' : sorteio < 0.85 ? 'restrito' : 'sigiloso'
      // Garante exemplos claros para a demonstração do perfil servidor (inclui um sigiloso).
      if (i === 0) nivelAcesso = (['restrito', 'publico-interno', 'sigiloso'] as const)[k]

      const dataArquivamento =
        status === 'Arquivado' ? isoDia(new Date(new Date(dataDocumento).getTime() + int(30, 400) * 86400000)) : null
      const localizacaoFisica =
        status === 'Arquivado'
          ? `Arquivo Central – Caixa ${int(1, 60)} – Prateleira ${pick(['A', 'B', 'C', 'D', 'E'])}`
          : srv.lotacao === 'Superintendência – Teresina'
            ? `Setor de Gestão de Pessoas – Armário ${int(1, 8)} – Gaveta ${int(1, 4)}`
            : `${srv.lotacao} – Arquivo Setorial – Pasta ${int(1, 40)}`

      const recente = seqDoc % 12 === 0
      const criadoEm = recente ? diasAtras(int(0, 25)) : `${dataDocumento}T12:00:00.000Z`

      const numero = `${int(1, 950)}/${dataDocumento.slice(0, 4)}`
      documentos.push({
        id,
        titulo: i === 0 && k === 2 ? 'Apuração preliminar – registro reservado' : `${tipo} nº ${numero} – ${pick(TITULOS[tipo])}`,
        tipo,
        numeroProcesso,
        matriculaServidor: srv.matricula,
        nomeServidor: srv.nome,
        lotacao: srv.lotacao,
        dataDocumento,
        dataArquivamento,
        localizacaoFisica,
        status,
        palavrasChave: [...PALAVRAS[tipo], srv.lotacao.split(' ').pop()!.toLowerCase()],
        urlArquivo: r() < 0.45 ? `/arquivos/documento-exemplo.html?id=${id}` : undefined,
        nivelAcesso,
        origemCadastro: 'painel',
        criadoPor: 'demo-rh',
        criadoEm,
        atualizadoEm: criadoEm,
      })
      ids.push(id)
      seqDoc++
      k++
    }

    processos.push({
      id: `proc-${p2(i + 1)}`,
      numeroProcesso,
      assunto: pick(ASSUNTOS),
      matriculaServidor: srv.matricula,
      nomeServidor: srv.nome,
      lotacao: srv.lotacao,
      situacao,
      unidadeAtual: situacao === 'Arquivado' ? 'SPRF-PI/NGP/Arquivo' : historico[historico.length - 1].unidade,
      historico,
      documentosIds: ids,
    })
  }

  // ---------------- Bloco 4: anexa os documentos "Capacitação" já existentes aos cursos ----------------
  servidores.forEach((s) => {
    const certificados = documentos.filter((d) => d.matriculaServidor === s.matricula && d.tipo === 'Capacitação' && d.nivelAcesso !== 'sigiloso')
    certificados.forEach((doc, k) => {
      const cap = s.capacitacoes[k]
      if (!cap) return
      cap.documentoId = doc.id
      cap.dataConclusao = doc.dataDocumento
      doc.titulo = `Certificado – ${cap.nome}`
      doc.palavrasChave = [...new Set([...doc.palavrasChave, 'certificado', cap.nome.toLowerCase()])]
    })
  })

  // ---------------- Autoatendimento: solicitações de exemplo ----------------
  const porMatricula = (m: string) => servidores.find((s) => s.matricula === m)!
  const solicitacoes: Solicitacao[] = []
  const novaSol = (m: string, dados: Partial<Solicitacao> & Pick<Solicitacao, 'tipo'>): Solicitacao => {
    const s = porMatricula(m)
    const sol: Solicitacao = {
      id: `sol-${p2(solicitacoes.length + 1)}`,
      matriculaServidor: s.matricula,
      nomeServidor: s.nome,
      lotacao: s.lotacao,
      status: 'pendente',
      criadaEm: diasAtras(int(1, 9)),
      criadaPorUid: CONTAS_DEMO.find((c) => c.matricula === m)?.uid ?? `uid-${m}`,
      origem: 'totem',
      ...dados,
    }
    solicitacoes.push(sol)
    return sol
  }
  // Pendentes da Delegacia de Parnaíba → a gestora 1002 pode aprovar.
  novaSol('1018', { tipo: 'capacitacao', capacitacao: { nome: 'Atendimento Pré-Hospitalar (APH) – Reciclagem', area: 'Saúde e segurança', cargaHoraria: 20, instituicao: 'Corpo de Bombeiros Militar do PI', dataConclusao: mesesAtras(1) }, nomeArquivo: 'certificado-aph-2026.pdf' })
  novaSol('1019', { tipo: 'documento', documento: { titulo: 'Diploma de especialização em Gestão Pública', tipo: 'Capacitação', descricao: 'Pós-graduação lato sensu concluída em 2025.' }, nomeArquivo: 'diploma-especializacao.pdf', origem: 'painel' })
  // Pendente da própria gestora → ela não pode aprovar o próprio pedido; só o RH.
  novaSol('1002', { tipo: 'capacitacao', capacitacao: { nome: 'Gestão de Riscos no Setor Público', area: 'Gestão', cargaHoraria: 30, instituicao: 'ENAP', dataConclusao: mesesAtras(2) }, nomeArquivo: 'certificado-gestao-riscos.pdf', origem: 'painel' })
  // Pendente de Teresina → o RH aprova (não há conta de gestor de Teresina na demonstração).
  novaSol('1013', { tipo: 'capacitacao', capacitacao: { nome: 'Operação de Radar Portátil', area: 'Operacional', cargaHoraria: 16, instituicao: 'UniPRF (EAD)', dataConclusao: mesesAtras(3) } })
  // Histórico da Camila 1001: uma aprovada (há 7 meses) e uma recusada.
  const rh = CONTAS_DEMO[2]
  const aprovada = novaSol('1001', {
    tipo: 'capacitacao',
    capacitacao: { ...{ nome: CURSO_LGPD.nome, area: CURSO_LGPD.area, cargaHoraria: CURSO_LGPD.ch, instituicao: CURSO_LGPD.inst }, dataConclusao: mesesAtras(8) },
    status: 'aprovada',
    criadaEm: `${mesesAtras(7)}T10:00:00.000Z`,
    decididaEm: `${mesesAtras(7)}T15:00:00.000Z`,
    decididaPorUid: rh.uid,
    decididaPorNome: `${rh.nome} (RH)`,
  })
  const camila = servidores[0]
  if (!camila.capacitacoes.some((c) => c.nome === CURSO_LGPD.nome))
    camila.capacitacoes.push({ id: `cap-1001-${camila.capacitacoes.length + 1}`, ...aprovada.capacitacao! })
  novaSol('1001', {
    tipo: 'documento',
    documento: { titulo: 'Certificado de proficiência em inglês', tipo: 'Capacitação', descricao: 'Nível intermediário.' },
    nomeArquivo: 'ingles.jpg',
    status: 'recusada',
    criadaEm: diasAtras(40),
    decididaEm: diasAtras(38),
    decididaPorUid: rh.uid,
    decididaPorNome: `${rh.nome} (RH)`,
    motivoRecusa: 'A imagem do certificado está ilegível. Envie novamente em PDF.',
  })

  // ---------------- Logs de exemplo (últimos 30 dias) ----------------
  const logs: LogAcesso[] = []
  const termosSemResultado = ['averbação 1987', 'portaria 12/1999', 'licença prêmio 2001', 'ficha funcional antiga', '08665.000001/1998-01']
  const termosComuns = ['férias', 'progressão', 'averbação', 'portaria', 'capacitação', 'ficha funcional']
  let seqLog = 1
  for (let d = 29; d >= 0; d--) {
    const nDia = int(3, 14)
    for (let j = 0; j < nDia; j++) {
      const u = pick(CONTAS_DEMO)
      const data = new Date(agora.getTime() - d * 86400000)
      data.setHours(int(8, 17), int(0, 59), int(0, 59), 0)
      if (data > agora) continue
      const origem = r() < 0.8 ? 'totem' : 'painel'
      const base = { uid: u.uid, nomeUsuario: u.nome, unidade: u.unidade, origem } as const
      const semResultado = r() < 0.12
      logs.push({
        ...base,
        id: `log-${seqLog++}`,
        acao: 'consulta',
        alvo: semResultado ? `texto: ${pick(termosSemResultado)}` : `texto: ${pick(termosComuns)}`,
        resultados: semResultado ? 0 : int(1, 12),
        data: data.toISOString(),
      })
      if (!semResultado && r() < 0.7) {
        const doc = r() < 0.5 ? documentos[int(0, 14)] : pick(documentos)
        logs.push({ ...base, id: `log-${seqLog++}`, acao: 'visualizacao', alvo: doc.id, detalhe: doc.titulo, data: new Date(data.getTime() + 60000).toISOString() })
      }
      // Acessos a fichas (LGPD visível): gestor (da sua unidade) e RH abrindo fichas no painel.
      if (u.perfil !== 'servidor' && r() < 0.35) {
        const candidatos = u.perfil === 'gestor' ? servidores.filter((s) => s.lotacao === u.unidade) : servidores
        const s = pick(candidatos)
        logs.push({ ...base, origem: 'painel', id: `log-${seqLog++}`, acao: 'visualizacao', alvo: s.id, detalhe: `Ficha: ${s.nome} (${s.matricula})`, data: new Date(data.getTime() + 120000).toISOString() })
      }
    }
  }

  return { servidores, documentos, processos, usuarios: CONTAS_DEMO, logs, solicitacoes, extratos: [] }
}
