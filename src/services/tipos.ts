import type {
  AcaoLog,
  DadosDocumento,
  Documento,
  LogAcesso,
  Lotacao,
  Movimentacao,
  NivelAcesso,
  NovoLog,
  Origem,
  Perfil,
  Processo,
  NovaSolicitacao,
  Servidor,
  Solicitacao,
  StatusDocumento,
  StatusSolicitacao,
  TipoDocumento,
  Usuario,
} from '../types'

/** Quem está pedindo e de onde: toda operação de dados recebe este contexto. */
export interface Contexto {
  usuario: Usuario
  origem: Origem
}

export interface FiltrosDocumento {
  /** Texto livre: título, palavras-chave, nome do servidor, localização. */
  texto?: string
  /** Aceita com ou sem pontuação. */
  numeroProcesso?: string
  /** Matrícula exata ou parte do nome do servidor. */
  servidor?: string
  /** Restringe à matrícula informada (ex.: "Meus documentos"). */
  matriculaServidor?: string
  tipo?: TipoDocumento
  status?: StatusDocumento
  lotacao?: Lotacao
  nivelAcesso?: NivelAcesso
  /** AAAA-MM-DD, comparado com dataDocumento. */
  dataInicio?: string
  dataFim?: string
}

export interface DocumentosService {
  /** `registrar: false` só para cálculos internos (indicadores); buscas do usuário sempre geram log. */
  buscar(filtros: FiltrosDocumento, ctx: Contexto, opcoes?: { registrar?: boolean }): Promise<Documento[]>
  obterPorId(id: string, ctx: Contexto): Promise<Documento | null>
  /** Documentos que coincidem em nº de processo + tipo + servidor. */
  verificarDuplicidade(dados: Pick<Documento, 'numeroProcesso' | 'tipo' | 'matriculaServidor'>, ctx: Contexto, ignorarId?: string): Promise<Documento[]>
  criar(dados: DadosDocumento, ctx: Contexto): Promise<Documento>
  atualizar(id: string, dados: Partial<DadosDocumento>, ctx: Contexto): Promise<Documento>
  arquivar(id: string, localizacaoFisica: string, ctx: Contexto): Promise<Documento>
}

export interface ServidoresService {
  /** Servidor: só a própria ficha · Gestor: só a sua unidade · RH: todos. */
  listar(ctx: Contexto): Promise<Servidor[]>
  /** Abre a ficha (gera log de visualização). */
  obterPorMatricula(matricula: string, ctx: Contexto): Promise<Servidor | null>
  /**
   * Quantas pessoas têm cada competência em TODA a Superintendência (só números, sem nomes).
   * Usado pelo alerta de risco para medir raridade sem expor fichas de outras unidades.
   */
  contagemCompetencias(ctx: Contexto): Promise<Record<string, number>>
}

export interface FiltrosSolicitacao {
  status?: StatusSolicitacao
  matriculaServidor?: string
}

/** Autoatendimento: o servidor envia; gestor da unidade ou RH aprova/recusa. */
export interface SolicitacoesService {
  /** Servidor: as próprias · Gestor: as da unidade · RH: todas. Mais recentes primeiro. */
  listar(filtros: FiltrosSolicitacao, ctx: Contexto): Promise<Solicitacao[]>
  /** Sempre em nome do próprio usuário logado (matrícula e unidade dele), com status "pendente". */
  criar(dados: NovaSolicitacao, ctx: Contexto): Promise<Solicitacao>
  /**
   * Aprova ou recusa. Ao aprovar, aplica na ficha (curso/documento) e atualiza `fichaAtualizadaEm`.
   * Gestor só decide pedidos da própria unidade e nunca o próprio pedido.
   */
  decidir(id: string, decisao: 'aprovada' | 'recusada', motivoRecusa: string | undefined, ctx: Contexto): Promise<Solicitacao>
}

export interface ProcessosService {
  listar(ctx: Contexto): Promise<Processo[]>
  obterPorId(id: string, ctx: Contexto): Promise<Processo | null>
  obterPorNumero(numeroProcesso: string, ctx: Contexto): Promise<Processo | null>
  adicionarMovimentacao(id: string, mov: Movimentacao, novaSituacao: Processo['situacao'] | null, ctx: Contexto): Promise<Processo>
}

export interface FiltrosLog {
  desde?: string
  ate?: string
  origem?: Origem
  acao?: AcaoLog
  /** Logs sobre um registro específico (ex.: id da ficha → "quem acessou esta ficha"). */
  alvo?: string
}

export interface LogsService {
  /** Logs são somente-inclusão: não existe editar nem apagar. */
  registrar(log: NovoLog, usuario: Usuario): Promise<void>
  listar(filtros: FiltrosLog, ctx: Contexto): Promise<LogAcesso[]>
}

export interface AuthService {
  entrar(matricula: string, senha: string, origem: Origem): Promise<Usuario>
  /** Recebe o contexto para registrar o logout antes de encerrar a sessão. */
  sair(ctx: Contexto | null): Promise<void>
  /** Chama `cb` com o usuário atual (ou null) sempre que a sessão mudar. */
  observar(cb: (usuario: Usuario | null) => void): () => void
}

export interface NovoUsuario {
  nome: string
  matricula: string
  perfil: Perfil
  unidade: Lotacao
  senha: string
}

export interface UsuariosService {
  listar(ctx: Contexto): Promise<Usuario[]>
  criar(dados: NovoUsuario, ctx: Contexto): Promise<Usuario>
  alterarPerfil(uid: string, perfil: Perfil, ctx: Contexto): Promise<void>
}

/** Contrato que qualquer fonte de dados precisa cumprir (Firebase hoje, SharePoint no futuro). */
export interface DataProvider {
  nome: 'firebase' | 'local' | 'sharepoint'
  auth: AuthService
  documentos: DocumentosService
  servidores: ServidoresService
  processos: ProcessosService
  logs: LogsService
  usuarios: UsuariosService
  solicitacoes: SolicitacoesService
}

/** Erro com mensagem já em português, pronta para exibir ao usuário. */
export type CodigoErro = 'credenciais' | 'permissao' | 'nao-encontrado' | 'validacao' | 'rede' | 'desconhecido'

export class ErroServico extends Error {
  codigo: CodigoErro
  constructor(message: string, codigo: CodigoErro = 'desconhecido') {
    super(message)
    this.name = 'ErroServico'
    this.codigo = codigo
  }
}
