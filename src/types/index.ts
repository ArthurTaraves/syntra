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

export interface Servidor {
  id: string
  matricula: string
  nome: string
  cargo: string
  lotacao: Lotacao
  situacao: SituacaoServidor
  dataIngresso: string
  email: string
  /** Sempre mascarado, ex.: ***.456.789-** — o CPF completo nunca é armazenado. */
  cpfMascarado: string
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
  /** Formato SEI fictício: 08665.000123/2024-11 */
  numeroProcesso: string
  matriculaServidor: string
  /** Desnormalizado do servidor: permite busca por nome sem ler a coleção de servidores. */
  nomeServidor: string
  /** Desnormalizado do servidor: usado pelas regras do gestor (documentos da sua unidade). */
  lotacao: Lotacao
  dataDocumento: string
  dataArquivamento: string | null
  localizacaoFisica: string
  status: StatusDocumento
  palavrasChave: string[]
  urlArquivo?: string
  nivelAcesso: NivelAcesso
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

export const PERFIS = ['servidor', 'gestor', 'admin'] as const
export type Perfil = (typeof PERFIS)[number]

export interface Usuario {
  uid: string
  nome: string
  matricula: string
  perfil: Perfil
  unidade: Lotacao
}

export const ACOES_LOG = ['consulta', 'visualizacao', 'download', 'edicao', 'login', 'logout'] as const
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
