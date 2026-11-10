// Dados 100% FICTÍCIOS para o protótipo SYNTRA.
// Nomes, matrículas, CPFs e números de processo são inventados e gerados por
// um gerador pseudoaleatório com semente fixa (os mesmos dados a cada execução).
// Este arquivo só importa TIPOS, para poder ser usado também pelo script Node de seed.

import type {
  Documento,
  LogAcesso,
  Lotacao,
  Movimentacao,
  NivelAcesso,
  Processo,
  Servidor,
  SituacaoProcesso,
  StatusDocumento,
  TipoDocumento,
  Usuario,
} from '../types'

const LOTACOES_SEED: Lotacao[] = [
  'Superintendência – Teresina',
  'Delegacia de Teresina',
  'Delegacia de Parnaíba',
  'Delegacia de Picos',
  'Delegacia de Floriano',
  'Delegacia de Corrente',
]

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
// Contas de demonstração (também listadas no README)
// UMA única conta de demonstração, com acesso total (admin): entra no totem e no painel.
// Os perfis servidor/gestor continuam no código e nas regras do Firestore para a
// implantação real — apenas não há contas de demonstração para eles.
// ---------------------------------------------------------------------------
export const SENHA_DEMO = 'syntra123'

export const CONTAS_DEMO: Usuario[] = [
  { uid: 'demo-camila', nome: 'Camila', matricula: '1001', perfil: 'admin', unidade: 'Superintendência – Teresina' },
]

const PRENOMES = [
  'Arthur', 'Beatriz', 'Davi', 'Elisa', 'Fábio', 'Giovana', 'Heitor', 'Isadora', 'Joaquim', 'Larissa',
  'Matheus', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sabrina', 'Tiago', 'Valéria', 'Wesley', 'Yasmin',
  'Bruno', 'Camila', 'Diego', 'Fernanda', 'Gustavo', 'Juliana', 'Leandro',
]
const SOBRENOMES = [
  'Albuquerque', 'Barros', 'Cavalcante', 'Damasceno', 'Esteves', 'Falcão', 'Gouveia', 'Holanda', 'Ibiapina',
  'Junqueira', 'Lacerda', 'Macedo', 'Nogueira', 'Pacheco', 'Quaresma', 'Rocha', 'Sampaio', 'Teixeira',
  'Uchôa', 'Vasconcelos', 'Xavier', 'Zanetti', 'Brandão', 'Coutinho', 'Freitas',
]
const CARGOS = [
  'Policial Rodoviário Federal',
  'Policial Rodoviário Federal',
  'Policial Rodoviário Federal',
  'Agente Administrativo',
  'Analista Técnico-Administrativo',
  'Técnico em Assuntos Educacionais',
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
}

/** Gera o acervo fictício. `agora` ancora as datas recentes (cadastros do mês e logs). */
export function gerarSeed(agora: Date = new Date()): DadosSeed {
  const r = mulberry32(20261110)
  const int = (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]
  const dataEntre = (anoIni: number, anoFim: number) =>
    `${int(anoIni, anoFim)}-${p2(int(1, 12))}-${p2(int(1, 28))}`

  // ---------------- Servidores (30) ----------------
  const servidores: Servidor[] = []
  const nomesUsados = new Set(CONTAS_DEMO.map((c) => c.nome))
  // Homônimos (mesmo primeiro e último nome) recebem a matrícula no e-mail.
  const emailsUsados = new Set<string>()
  const emailUnico = (base: string, matricula: string) => {
    const email = `${emailsUsados.has(base) ? `${base}.${matricula}` : base}@exemplo.syntra.local`
    emailsUsados.add(base)
    return email
  }
  for (let i = 0; i < 30; i++) {
    const demo = CONTAS_DEMO[i]
    let nome = demo?.nome
    while (!nome) {
      const n = `${pick(PRENOMES)} ${pick(SOBRENOMES)} ${pick(SOBRENOMES)}`
      if (!nomesUsados.has(n) && n.split(' ')[1] !== n.split(' ')[2]) {
        nomesUsados.add(n)
        nome = n
      }
    }
    // 1001: conta de demonstração (Camila); 1002–1030: demais servidores (4 dígitos).
    const matricula = String(1001 + i)
    const partes = nome
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .split(' ')
    // Nome de uma palavra só (a conta "Camila"): usa a matrícula no e-mail.
    const login = partes.length > 1 ? [partes[0], partes[partes.length - 1]] : [partes[0], matricula]
    servidores.push({
      id: `srv-${matricula}`,
      matricula,
      nome,
      cargo: demo ? (demo.perfil === 'servidor' ? CARGOS[0] : CARGOS[4]) : pick(CARGOS),
      lotacao: demo?.unidade ?? LOTACOES_SEED[i % LOTACOES_SEED.length],
      situacao: i < 3 ? 'ativo' : r() < 0.75 ? 'ativo' : pick(['aposentado', 'cedido', 'licença'] as const),
      dataIngresso: dataEntre(1994, 2022),
      email: emailUnico(`${login[0]}.${login[1]}`, matricula),
      cpfMascarado: `***.${int(100, 999)}.${int(100, 999)}-**`,
    })
  }

  // ---------------- Processos (40) e Documentos (120) ----------------
  const processos: Processo[] = []
  const documentos: Documento[] = []
  let seqDoc = 1

  for (let i = 0; i < 40; i++) {
    // Os 4 primeiros processos pertencem à conta "servidor" de demonstração.
    const srv = i < 4 ? servidores[0] : servidores[(i % 29) + 1]
    const ano = int(2009, 2025)
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
      ;['Ficha Funcional', 'Férias', 'Outros'].forEach((t) => tiposProc.add(t as TipoDocumento))
    }

    const ids: string[] = []
    let k = 0
    for (const tipo of tiposProc) {
      const id = `doc-${String(seqDoc).padStart(4, '0')}`
      const dataDocumento = historico[Math.min(k, historico.length - 1)].data
      const status: StatusDocumento =
        situacao === 'Arquivado' || situacao === 'Concluído'
          ? r() < 0.8
            ? 'Arquivado'
            : 'Ativo'
          : r() < 0.6
            ? 'Em tramitação'
            : 'Ativo'
      const sorteio = r()
      let nivelAcesso: NivelAcesso = sorteio < 0.45 ? 'publico-interno' : sorteio < 0.85 ? 'restrito' : 'sigiloso'
      // Garante exemplos claros para a demonstração do perfil servidor.
      if (i === 0) nivelAcesso = (['restrito', 'publico-interno', 'sigiloso'] as const)[k]

      const dataArquivamento =
        status === 'Arquivado' ? isoDia(new Date(new Date(dataDocumento).getTime() + int(30, 400) * 86400000)) : null
      const localizacaoFisica =
        status === 'Arquivado'
          ? `Arquivo Central – Caixa ${int(1, 60)} – Prateleira ${pick(['A', 'B', 'C', 'D', 'E'])}`
          : srv.lotacao === 'Superintendência – Teresina'
            ? `Setor de Gestão de Pessoas – Armário ${int(1, 8)} – Gaveta ${int(1, 4)}`
            : `${srv.lotacao} – Arquivo Setorial – Pasta ${int(1, 40)}`

      // ~10 documentos cadastrados nos últimos 30 dias (indicador "cadastrados no mês").
      const recente = seqDoc % 12 === 0
      const criadoEm = recente
        ? new Date(agora.getTime() - int(0, 25) * 86400000).toISOString()
        : `${dataDocumento}T12:00:00.000Z`

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
        criadoPor: 'demo-admin',
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
        // Viés para alguns documentos aparecerem como "mais consultados".
        const doc = r() < 0.5 ? documentos[int(0, 14)] : pick(documentos)
        logs.push({
          ...base,
          id: `log-${seqLog++}`,
          acao: 'visualizacao',
          alvo: doc.id,
          detalhe: doc.titulo,
          data: new Date(data.getTime() + 60000).toISOString(),
        })
      }
    }
  }

  return { servidores, documentos, processos, usuarios: CONTAS_DEMO, logs }
}
