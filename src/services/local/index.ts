// Provedor LOCAL (modo demonstração): roda 100% no navegador com os dados fictícios
// de src/data/seed.ts, persistidos no localStorage. Aplica as MESMAS regras de perfil
// do Firestore (src/services/permissoes.ts), para que a demonstração seja fiel.
// É usado automaticamente quando o .env do Firebase não está configurado.

import { gerarSeed, SENHA_DEMO, type DadosSeed } from '../../data/seed'
import { hojeISO, somenteDigitos } from '../../lib/texto'
import type { Documento, LogAcesso, Usuario } from '../../types'
import { aplicarFiltros } from '../filtros'
import { podeVerDocumento, podeVerProcesso, podeVerServidor } from '../permissoes'
import { ErroServico, type Contexto, type DataProvider } from '../tipos'

const CHAVE_DADOS = 'syntra:demo:dados:v1'
const CHAVE_SENHAS = 'syntra:demo:senhas:v1'
const CHAVE_SESSAO = 'syntra:demo:sessao'

interface Estado extends DadosSeed {
  senhas: Record<string, string>
}

function lerJSON<T>(storage: Storage | undefined, chave: string): T | null {
  try {
    const bruto = storage?.getItem(chave)
    return bruto ? (JSON.parse(bruto) as T) : null
  } catch {
    return null
  }
}
function gravarJSON(storage: Storage | undefined, chave: string, valor: unknown) {
  try {
    storage?.setItem(chave, JSON.stringify(valor))
  } catch {
    /* armazenamento indisponível (aba anônima etc.): segue só em memória */
  }
}
const ls = typeof localStorage !== 'undefined' ? localStorage : undefined
const ss = typeof sessionStorage !== 'undefined' ? sessionStorage : undefined

function carregarEstado(): Estado {
  const dados = lerJSON<DadosSeed>(ls, CHAVE_DADOS) ?? gerarSeed()
  const senhas =
    lerJSON<Record<string, string>>(ls, CHAVE_SENHAS) ??
    Object.fromEntries(dados.usuarios.map((u) => [u.matricula, SENHA_DEMO]))
  return { ...dados, senhas }
}

const espera = (ms = 180) => new Promise((r) => setTimeout(r, ms))
const clonar = <T,>(v: T): T => structuredClone(v)

export function criarProviderLocal(): DataProvider {
  const estado = carregarEstado()
  const salvar = () => {
    const { senhas, ...dados } = estado
    gravarJSON(ls, CHAVE_DADOS, dados)
    gravarJSON(ls, CHAVE_SENHAS, senhas)
  }
  salvar()

  let sessao: Usuario | null = lerJSON<Usuario>(ss, CHAVE_SESSAO)
  const ouvintes = new Set<(u: Usuario | null) => void>()
  const definirSessao = (u: Usuario | null) => {
    sessao = u
    if (u) gravarJSON(ss, CHAVE_SESSAO, u)
    else ss?.removeItem(CHAVE_SESSAO)
    ouvintes.forEach((cb) => cb(u))
  }

  const exigirAdmin = (ctx: Contexto) => {
    if (ctx.usuario.perfil !== 'admin') throw new ErroServico('Você não tem permissão para esta ação.', 'permissao')
  }
  const docPorId = (id: string) => {
    const d = estado.documentos.find((x) => x.id === id)
    if (!d) throw new ErroServico('Documento não encontrado.', 'nao-encontrado')
    return d
  }

  return {
    nome: 'local',

    auth: {
      async entrar(matricula, senha) {
        await espera(350)
        const m = somenteDigitos(matricula)
        const usuario = estado.usuarios.find((u) => u.matricula === m)
        if (!usuario || estado.senhas[m] !== senha) {
          throw new ErroServico('Matrícula ou senha incorretas.', 'credenciais')
        }
        definirSessao(clonar(usuario))
        return clonar(usuario)
      },
      async sair() {
        definirSessao(null)
      },
      observar(cb) {
        ouvintes.add(cb)
        queueMicrotask(() => cb(sessao))
        return () => ouvintes.delete(cb)
      },
    },

    documentos: {
      async buscar(filtros, ctx) {
        await espera()
        const permitidos = estado.documentos.filter((d) => podeVerDocumento(ctx.usuario, d, ctx.origem))
        return clonar(aplicarFiltros(permitidos, filtros))
      },
      async obterPorId(id, ctx) {
        await espera()
        const d = estado.documentos.find((x) => x.id === id)
        return d && podeVerDocumento(ctx.usuario, d, ctx.origem) ? clonar(d) : null
      },
      async verificarDuplicidade(dados, ctx, ignorarId) {
        exigirAdmin(ctx)
        const proc = somenteDigitos(dados.numeroProcesso)
        return clonar(
          estado.documentos.filter(
            (d) =>
              d.id !== ignorarId &&
              somenteDigitos(d.numeroProcesso) === proc &&
              d.tipo === dados.tipo &&
              d.matriculaServidor === dados.matriculaServidor,
          ),
        )
      },
      async criar(dados, ctx) {
        exigirAdmin(ctx)
        await espera()
        const agora = new Date().toISOString()
        const doc: Documento = {
          ...dados,
          id: `doc-${Date.now().toString(36)}`,
          criadoPor: ctx.usuario.uid,
          criadoEm: agora,
          atualizadoEm: agora,
        }
        estado.documentos.push(doc)
        salvar()
        return clonar(doc)
      },
      async atualizar(id, dados, ctx) {
        exigirAdmin(ctx)
        await espera()
        const d = docPorId(id)
        Object.assign(d, dados, { atualizadoEm: new Date().toISOString() })
        salvar()
        return clonar(d)
      },
      async arquivar(id, localizacaoFisica, ctx) {
        exigirAdmin(ctx)
        await espera()
        const d = docPorId(id)
        Object.assign(d, {
          status: 'Arquivado',
          dataArquivamento: hojeISO(),
          localizacaoFisica,
          atualizadoEm: new Date().toISOString(),
        })
        salvar()
        return clonar(d)
      },
    },

    servidores: {
      async listar(ctx) {
        await espera()
        return clonar(
          estado.servidores
            .filter((s) => podeVerServidor(ctx.usuario, s))
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
        )
      },
      async obterPorMatricula(matricula, ctx) {
        await espera()
        const s = estado.servidores.find((x) => x.matricula === matricula)
        return s && podeVerServidor(ctx.usuario, s) ? clonar(s) : null
      },
    },

    processos: {
      async listar(ctx) {
        await espera()
        return clonar(estado.processos.filter((p) => podeVerProcesso(ctx.usuario, p)))
      },
      async obterPorId(id, ctx) {
        await espera()
        const p = estado.processos.find((x) => x.id === id)
        return p && podeVerProcesso(ctx.usuario, p) ? clonar(p) : null
      },
      async obterPorNumero(numero, ctx) {
        const alvo = somenteDigitos(numero)
        const p = estado.processos.find((x) => somenteDigitos(x.numeroProcesso) === alvo)
        return p && podeVerProcesso(ctx.usuario, p) ? clonar(p) : null
      },
      async adicionarMovimentacao(id, mov, novaSituacao, ctx) {
        await espera()
        const p = estado.processos.find((x) => x.id === id)
        if (!p) throw new ErroServico('Processo não encontrado.', 'nao-encontrado')
        const pode = ctx.usuario.perfil === 'admin' || (ctx.usuario.perfil === 'gestor' && p.lotacao === ctx.usuario.unidade)
        if (!pode) throw new ErroServico('Você não tem permissão para movimentar este processo.', 'permissao')
        p.historico.push(mov)
        p.unidadeAtual = mov.unidade
        if (novaSituacao) p.situacao = novaSituacao
        salvar()
        return clonar(p)
      },
    },

    logs: {
      async registrar(log, usuario) {
        const novo: LogAcesso = {
          ...log,
          id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          uid: usuario.uid,
          nomeUsuario: usuario.nome,
          unidade: usuario.unidade,
          data: new Date().toISOString(),
        }
        estado.logs.push(novo)
        if (estado.logs.length > 5000) estado.logs.splice(0, estado.logs.length - 5000)
        salvar()
      },
      async listar(f, ctx) {
        exigirAdmin(ctx)
        await espera()
        return clonar(
          estado.logs
            .filter(
              (l) =>
                (!f.desde || l.data >= f.desde) &&
                (!f.ate || l.data <= f.ate) &&
                (!f.origem || l.origem === f.origem) &&
                (!f.acao || l.acao === f.acao),
            )
            .sort((a, b) => b.data.localeCompare(a.data)),
        )
      },
    },

    usuarios: {
      async listar(ctx) {
        exigirAdmin(ctx)
        await espera()
        return clonar(estado.usuarios)
      },
      async criar(dados, ctx) {
        exigirAdmin(ctx)
        await espera()
        const matricula = somenteDigitos(dados.matricula)
        if (estado.usuarios.some((u) => u.matricula === matricula)) {
          throw new ErroServico('Já existe um usuário com esta matrícula.', 'validacao')
        }
        const novo: Usuario = {
          uid: `local-${matricula}`,
          nome: dados.nome.trim(),
          matricula,
          perfil: dados.perfil,
          unidade: dados.unidade,
        }
        estado.usuarios.push(novo)
        estado.senhas[matricula] = dados.senha
        salvar()
        return clonar(novo)
      },
      async alterarPerfil(uid, perfil, ctx) {
        exigirAdmin(ctx)
        await espera()
        const u = estado.usuarios.find((x) => x.uid === uid)
        if (!u) throw new ErroServico('Usuário não encontrado.', 'nao-encontrado')
        u.perfil = perfil
        salvar()
      },
    },
  }
}

/** Apaga os dados da demonstração e recarrega o acervo fictício original. */
export function restaurarDadosDemonstracao() {
  try {
    ls?.removeItem(CHAVE_DADOS)
    ls?.removeItem(CHAVE_SENHAS)
    ss?.removeItem(CHAVE_SESSAO)
  } catch {
    /* ignora */
  }
}
