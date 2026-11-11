// Tipos de domínio do SYNTRA.
// Datas são armazenadas como strings ISO (AAAA-MM-DD ou AAAA-MM-DDTHH:mm:ss.sssZ),
// o que permite ordenação lexicográfica tanto no Firestore quanto no SharePoint.

export const LOTACOES = [
  'Superintendência – Teresina',
  'Delegacia de Teresina',
  'Delegacia de Parnaíba',
  'Delegacia de Picos',
  'Delegacia de Floriano',
  'Delegacia de Corrente',
] as const
export type Lotacao = (typeof LOTACOES)[number]

export const SITUACOES_SERVIDOR = ['ativo', 'aposentado', 'cedido', 'licença'] as const
export type SituacaoServidor = (typeof SITUACOES_SERVIDOR)[number]

/** Bloco 2 da ficha: passagem por uma unidade (histórico de transferências). */
export interface MovimentacaoLotacao {
  unidade: Lotacao
  inicio: string
  /** null = lotação atual. */
  fim: string | null
  motivo: string
}

export const AREAS_CAPACITACAO = ['Operacional', 'Gestão', 'Tecnologia', 'Atendimento', 'Saúde e segurança', 'Jurídica'] as const
export type AreaCapacitacao = (typeof AREAS_CAPACITACAO)[number]

/** Bloco 4 da ficha: curso ou certificação, opcionalmente com documento anexado no acervo. */
export interface Capacitacao {
  id: string
  nome: string
  area: AreaCapacitacao
  cargaHoraria: number
  instituicao: string
  dataConclusao: string
  /** id do Documento (tipo "Capacitação") que comprova o curso, se houver. */
  documentoId?: string
}

/**
 * Ficha do servidor (prontuário ligado à matrícula), com os 5 blocos da proposta:
 * 1) dados básicos · 2) lotação e movimentações · 3) tempo de serviço e aposentadoria ·
 * 4) cursos e capacitações · 5) perfil e talentos.
 */
export interface Servidor {
  id: string
  // 1. Dados básicos
  matricula: string
  nome: string
  cargo: string
  situacao: SituacaoServidor
  email: string
  /** Sempre mascarado, ex.: ***.456.789-** — o CPF completo nunca é armazenado. */
  cpfMascarado: string
  // 2. Lotação e movimentações
  lotacao: Lotacao
  historicoLotacoes: MovimentacaoLotacao[]
  // 3. Tempo de serviço e aposentadoria (cálculo em src/lib/aposentadoria.ts)
  dataIngresso: string
  dataNascimento: string
  /** Tempo de serviço anterior averbado (outros órgãos/INSS), em anos. */
  tempoAverbadoAnos?: number
  // 4. Cursos e capacitações
  capacitacoes: Capacitacao[]
  // 5. Perfil e talentos
  competencias: string[]
  /** Indicações para oportunidades (ex.: Liderança, Instrutoria). */
  indicacoes: string[]
  /** Última atualização aprovada da ficha ("atualizada há X meses"). */
  fichaAtualizadaEm: string
  /** id do último pedido de autoatendimento aprovado (rastreabilidade da atualização). */
  ultimaSolicitacaoAprovada?: string
}

export const INDICACOES = ['Liderança', 'Instrutoria', 'Mentoria', 'Projetos'] as const

// ---------------------------------------------------------------------------
// Autoatendimento: o servidor envia; o RH / Gestão aprova/recusa (ninguém decide o próprio pedido).
// ---------------------------------------------------------------------------
export const STATUS_SOLICITACAO = ['pendente', 'aprovada', 'recusada'] as const
export type StatusSolicitacao = (typeof STATUS_SOLICITACAO)[number]
export type TipoSolicitacao = 'capacitacao' | 'documento'

export interface Solicitacao {
  id: string
  tipo: TipoSolicitacao
  matriculaServidor: string
  nomeServidor: string
  lotacao: Lotacao
  capacitacao?: Omit<Capacitacao, 'id' | 'documentoId'>
  documento?: { titulo: string; tipo: TipoDocumento; descricao: string }
  /** Nome do arquivo informado pelo servidor (o armazenamento do arquivo em si entra com o Storage/SharePoint). */
  nomeArquivo?: string
  status: StatusSolicitacao
  criadaEm: string
  criadaPorUid: string
  origem: Origem
  decididaEm?: string
  decididaPorUid?: string
  decididaPorNome?: string
  motivoRecusa?: string
}

export type NovaSolicitacao = Pick<Solicitacao, 'tipo' | 'capacitacao' | 'documento' | 'nomeArquivo'>

// ---------------------------------------------------------------------------
// Extrato da ficha (impresso pelo próprio policial no totem) e sua verificação pública.
// ---------------------------------------------------------------------------
export const SECOES_EXTRATO = ['dados', 'lotacao', 'aposentadoria', 'cursos', 'competencias'] as const
export type SecaoExtrato = (typeof SECOES_EXTRATO)[number]

export const ROTULO_SECAO_EXTRATO: Record<SecaoExtrato, string> = {
  dados: 'Dados funcionais',
  lotacao: 'Lotação e movimentações',
  aposentadoria: 'Tempo de serviço e previsão de aposentadoria',
  cursos: 'Cursos e capacitações',
  competencias: 'Competências',
}

/**
 * Registro de um extrato emitido. Guarda SÓ o necessário para a verificação pública
 * (quem verifica vê exatamente estes campos): nenhum dado da ficha em si.
 */
export interface Extrato {
  /** Código de verificação, ex.: SYN-7K4Q-2M9X (também é o id do registro). */
  codigo: string
  matriculaServidor: string
  nomeServidor: string
  emitidoEm: string
  secoes: SecaoExtrato[]
  /** Só no registro local; no Firestore não é gravado (o documento é legível publicamente). */
  emitidoPorUid?: string
}

export const TIPOS_DOCUMENTO = [
  'Portaria',
  'Ofício',
  'Requerimento',
  'Férias',
  'Licença',
  'Progressão',
  'Averbação de Tempo',
  'Capacitação',
  'Ficha Funcional',
  'Outros',
] as const
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

export const STATUS_DOCUMENTO = ['Ativo', 'Arquivado', 'Em tramitação'] as const
export type StatusDocumento = (typeof STATUS_DOCUMENTO)[number]

export const NIVEIS_ACESSO = ['publico-interno', 'restrito', 'sigiloso'] as const
export type NivelAcesso = (typeof NIVEIS_ACESSO)[number]

export interface Documento {
  id: string
  titulo: string
  tipo: TipoDocumento
  /** Formato SEI fictício: 08665.000123/2024-11. Vazio ("") = documento sem processo (ex.: autoatendimento). */
  numeroProcesso: string
  matriculaServidor: string
  /** Desnormalizado do servidor: permite busca por nome sem ler a coleção de servidores. */
  nomeServidor: string
  /** Desnormalizado do servidor: usado nos filtros e relatórios por lotação. */
  lotacao: Lotacao
  dataDocumento: string
  dataArquivamento: string | null
  localizacaoFisica: string
  status: StatusDocumento
  palavrasChave: string[]
  urlArquivo?: string
  nivelAcesso: NivelAcesso
  /** "autoatendimento" = enviado pelo servidor e aprovado pelo RH / Gestão. */
  origemCadastro?: 'painel' | 'autoatendimento'
  /** Pedido de autoatendimento que originou o documento (quando origemCadastro = "autoatendimento"). */
  solicitacaoId?: string
  criadoPor: string
  criadoEm: string
  atualizadoEm: string
}

export type DadosDocumento = Omit<Documento, 'id' | 'criadoPor' | 'criadoEm' | 'atualizadoEm'>

export const SITUACOES_PROCESSO = ['Em andamento', 'Concluído', 'Arquivado', 'Sobrestado'] as const
export type SituacaoProcesso = (typeof SITUACOES_PROCESSO)[number]

export interface Movimentacao {
  data: string
  unidade: string
  descricao: string
}

export interface Processo {
  id: string
  numeroProcesso: string
  assunto: string
  matriculaServidor: string
  nomeServidor: string
  lotacao: Lotacao
  situacao: SituacaoProcesso
  unidadeAtual: string
  historico: Movimentacao[]
  documentosIds: string[]
}

/**
 * Dois níveis de acesso, pela matrícula (valem igual no totem e no computador):
 *  - servidor = Policial: só a PRÓPRIA ficha; não entra no painel.
 *  - admin    = RH / Gestão: vê e edita tudo, de todas as unidades.
 */
export const PERFIS = ['servidor', 'admin'] as const
export type Perfil = (typeof PERFIS)[number]

export interface Usuario {
  uid: string
  nome: string
  matricula: string
  perfil: Perfil
  unidade: Lotacao
}

export const ACOES_LOG = ['consulta', 'visualizacao', 'download', 'edicao', 'impressao', 'login', 'logout'] as const
export type AcaoLog = (typeof ACOES_LOG)[number]

export type Origem = 'totem' | 'painel'

export interface LogAcesso {
  id: string
  uid: string
  nomeUsuario: string
  acao: AcaoLog
  /** id do documento/servidor/processo, ou descrição da busca em consultas. */
  alvo: string
  data: string
  origem: Origem
  /** Texto auxiliar legível (ex.: título do documento consultado). */
  detalhe?: string
  /** Apenas para consultas: quantidade de itens retornados (0 = busca sem resultado). */
  resultados?: number
  /** Lotação do usuário no momento da ação (para relatórios por lotação). */
  unidade?: Lotacao
}

export type NovoLog = Omit<LogAcesso, 'id' | 'data' | 'uid' | 'nomeUsuario' | 'unidade'>
