// Provedor LOCAL (modo demonstração): roda 100% no navegador com os dados fictícios
// de src/data/seed.ts, persistidos no localStorage. Aplica as MESMAS regras de perfil
// do Firestore (src/services/permissoes.ts), para que a demonstração seja fiel.
// É usado automaticamente quando o .env do Firebase não está configurado.

import { gerarSeed, SENHA_DEMO, type DadosSeed } from '../../data/seed'
import { hojeISO, MSG_MATRICULA_INVALIDA, PADRAO_MATRICULA, somenteDigitos } from '../../lib/texto'
import type { Documento, LogAcesso, Solicitacao, Usuario } from '../../types'
import { efeitoDaAprovacao, validarSolicitacao } from '../autoatendimento'
import { normalizarCodigo, novoExtrato } from '../extratos'
import { aplicarFiltros } from '../filtros'
import {
  ehGestao,
  MSG_PROPRIO_PEDIDO,
  podeDecidirSolicitacao,
  podeMovimentarProcesso,
  podeVerDocumento,
  podeVerProcesso,
  podeVerServidor,
  podeVerSolicitacao,
} from '../permissoes'
import { ErroServico, type Contexto, type DataProvider } from '../tipos'

// Versão do acervo local. Ao mudar os dados fictícios, suba a versão: o navegador descarta
// os dados antigos e recarrega o acervo novo automaticamente.
//   v2 = matrículas de 4 dígitos · v3 = conta única · v4 = proposta oficial (3 contas Camila,
//   ficha em 5 blocos, solicitações de autoatendimento, cenário de aposentadorias e alertas)
//   v5 = totem como "Área do servidor" (só a própria ficha) e extratos com código de verificação
//   v6 = dois níveis de acesso (0001 Policial · 0002 RH / Gestão) e servidores fictícios 0003–0030
const VERSAO = 'v6'
const PREFIXO = 'syntra:demo:'
const CHAVE_DADOS = `${PREFIXO}dados:${VERSAO}`
const CHAVE_SENHAS = `${PREFIXO}senhas:${VERSAO}`
const CHAVE_SESSAO = `${PREFIXO}sessao:${VERSAO}`
const CHAVES_ATUAIS = [CHAVE_DADOS, CHAVE_SENHAS, CHAVE_SESSAO]

/** Remove qualquer chave "syntra:demo:*" de versões anteriores (v1, v2, …). */
function limparVersoesAntigas(storage: Storage | undefined) {
  if (!storage) return
  const antigas: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (k?.startsWith(PREFIXO) && !CHAVES_ATUAIS.includes(k)) antigas.push(k)
  }
  antigas.forEach((k) => storage.removeItem(k))
}

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
  // Remove os dados de versões anteriores (contas e matrículas antigas).
  try {
    limparVersoesAntigas(ls)
    limparVersoesAntigas(ss)
  } catch {
    /* armazenamento indisponível */
  }
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
    if (!ehGestao(ctx.usuario)) throw new ErroServico('Você não tem permissão para esta ação.', 'permissao')
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
        if (!proc) return [] // documentos sem processo (autoatendimento) não entram na checagem
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
        // Matrícula é texto de 4 dígitos: "0003" ≠ "3" (zeros à esquerda contam).
        const s = estado.servidores.find((x) => x.matricula === matricula)
        return s && podeVerServidor(ctx.usuario, s) ? clonar(s) : null
      },
    },

    extratos: {
      async emitir(secoes, ctx) {
        await espera()
        const servidor = estado.servidores.find((s) => s.matricula === ctx.usuario.matricula)
        if (!servidor) throw new ErroServico('Ficha não encontrada para a sua matrícula.', 'nao-encontrado')
        const extrato = novoExtrato(secoes, ctx, servidor.nome)
        estado.extratos.push(extrato)
        salvar()
        return clonar(extrato)
      },
      async verificar(codigo) {
        await espera()
        const e = estado.extratos.find((x) => x.codigo === normalizarCodigo(codigo))
        if (!e) return null
        // Verificação pública: devolve só os campos de verificação.
        const { emitidoPorUid: _uid, ...publico } = e
        return clonar(publico)
      },
    },

    solicitacoes: {
      async listar(f, ctx) {
        await espera()
        return clonar(
          estado.solicitacoes
            .filter(
              (s) =>
                podeVerSolicitacao(ctx.usuario, s) &&
                (!f.status || s.status === f.status) &&
                (!f.matriculaServidor || s.matriculaServidor === f.matriculaServidor),
            )
            .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
        )
      },
      async criar(dados, ctx) {
        validarSolicitacao(dados)
        await espera()
        const u = ctx.usuario
        const servidor = estado.servidores.find((s) => s.matricula === u.matricula)
        const sol: Solicitacao = {
          ...dados,
          id: `sol-${Date.now().toString(36)}`,
          matriculaServidor: u.matricula,
          nomeServidor: servidor?.nome ?? u.nome,
          lotacao: servidor?.lotacao ?? u.unidade,
          status: 'pendente',
          criadaEm: new Date().toISOString(),
          criadaPorUid: u.uid,
          origem: ctx.origem,
        }
        estado.solicitacoes.push(sol)
        salvar()
        return clonar(sol)
      },
      async decidir(id, decisao, motivoRecusa, ctx) {
        await espera()
        const sol = estado.solicitacoes.find((s) => s.id === id)
        if (!sol) throw new ErroServico('Solicitação não encontrada.', 'nao-encontrado')
        if (sol.status !== 'pendente') throw new ErroServico('Esta solicitação já foi decidida.', 'validacao')
        if (!podeDecidirSolicitacao(ctx.usuario, sol))
          throw new ErroServico(
            sol.matriculaServidor === ctx.usuario.matricula ? MSG_PROPRIO_PEDIDO : 'Você não tem permissão para decidir esta solicitação.',
            'permissao',
          )
        if (decisao === 'recusada' && !motivoRecusa?.trim()) throw new ErroServico('Informe o motivo da recusa.', 'validacao')

        if (decisao === 'aprovada') {
          const servidor = estado.servidores.find((s) => s.matricula === sol.matriculaServidor)
          if (!servidor) throw new ErroServico('Ficha do servidor não encontrada.', 'nao-encontrado')
          const efeito = efeitoDaAprovacao(sol, servidor)
          const agora = new Date().toISOString()
          let documentoId: string | undefined
          if (efeito.documento) {
            documentoId = `doc-${Date.now().toString(36)}`
            estado.documentos.push({ ...efeito.documento, id: documentoId, criadoPor: ctx.usuario.uid, criadoEm: agora, atualizadoEm: agora })
          }
          if (efeito.capacitacao)
            servidor.capacitacoes.push({ ...efeito.capacitacao, id: `cap-${servidor.matricula}-${Date.now().toString(36)}`, documentoId })
          servidor.fichaAtualizadaEm = efeito.fichaAtualizadaEm
          servidor.ultimaSolicitacaoAprovada = sol.id
        }
        Object.assign(sol, {
          status: decisao,
          decididaEm: new Date().toISOString(),
          decididaPorUid: ctx.usuario.uid,
          decididaPorNome: ctx.usuario.nome,
          motivoRecusa: decisao === 'recusada' ? motivoRecusa!.trim() : undefined,
        })
        salvar()
        return clonar(sol)
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
        if (!podeMovimentarProcesso(ctx.usuario)) throw new ErroServico('Você não tem permissão para movimentar este processo.', 'permissao')
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
                (!f.acao || l.acao === f.acao) &&
                (!f.alvo || l.alvo === f.alvo),
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
        if (!PADRAO_MATRICULA.test(matricula)) throw new ErroServico(MSG_MATRICULA_INVALIDA, 'validacao')
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
