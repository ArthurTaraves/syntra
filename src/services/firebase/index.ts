// Implementação do DataProvider com Firebase Auth + Firestore.
// As consultas são montadas por perfil para casar com firestore.rules: o Firestore
// recusa qualquer consulta que PODERIA retornar um documento proibido.

import { FirebaseError } from 'firebase/app'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Query,
  type QueryConstraint,
} from 'firebase/firestore'
import { hojeISO, mascararProcesso, somenteDigitos } from '../../lib/texto'
import { contarCompetencias } from '../../lib/rh'
import type { Documento, Extrato, LogAcesso, Origem, Processo, Servidor, Solicitacao, Usuario } from '../../types'
import { normalizarCodigo, novoExtrato, PADRAO_CODIGO_EXTRATO } from '../extratos'
import { efeitoDaAprovacao, validarSolicitacao } from '../autoatendimento'
import { aplicarFiltros } from '../filtros'
import { NIVEIS_TOTEM, podeDecidirSolicitacao, podeVerDocumento, podeVerProcesso } from '../permissoes'
import { ErroServico, type Contexto, type DataProvider, type FiltrosDocumento } from '../tipos'
import { comAppSecundario, emailDaMatricula, obterFirebase } from './app'

function traduzirErro(e: unknown): ErroServico {
  if (e instanceof ErroServico) return e
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        return new ErroServico('Matrícula ou senha incorretas.', 'credenciais')
      case 'auth/too-many-requests':
        return new ErroServico('Muitas tentativas. Aguarde alguns minutos e tente novamente.', 'credenciais')
      case 'auth/network-request-failed':
      case 'unavailable':
        return new ErroServico('Sem conexão com o servidor. Verifique a internet e tente novamente.', 'rede')
      case 'auth/email-already-in-use':
        return new ErroServico('Já existe um usuário com esta matrícula.', 'validacao')
      case 'auth/weak-password':
        return new ErroServico('A senha precisa ter pelo menos 6 caracteres.', 'validacao')
      case 'permission-denied':
        return new ErroServico('Você não tem permissão para acessar estes dados.', 'permissao')
      case 'not-found':
        return new ErroServico('Registro não encontrado.', 'nao-encontrado')
    }
  }
  console.error(e)
  return new ErroServico('Ocorreu um erro inesperado. Tente novamente.')
}

async function protegido<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    throw traduzirErro(e)
  }
}

/** Para leituras pontuais: "sem permissão" é tratado como "não encontrado". */
async function ouNulo<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof FirebaseError && e.code === 'permission-denied') return null
    throw traduzirErro(e)
  }
}

const comId = <T,>(snap: { id: string; data: () => DocumentData | undefined }) => ({ ...snap.data(), id: snap.id }) as T

export function criarProviderFirebase(): DataProvider {
  const { auth, db } = obterFirebase()
  const col = (nome: string) => collection(db, nome)

  async function carregarUsuario(uid: string): Promise<Usuario | null> {
    const snap = await getDoc(doc(db, 'usuarios', uid))
    return snap.exists() ? ({ ...(snap.data() as Omit<Usuario, 'uid'>), uid }) : null
  }

  /**
   * Restrição por perfil (o mesmo critério das regras) para coleções com lotacao/matriculaServidor.
   * No TOTEM ("Área do servidor") todo perfil fica restrito à própria matrícula.
   */
  function restricaoPerfil(u: Usuario, campoMatricula: 'matricula' | 'matriculaServidor', origem: Origem = 'painel'): QueryConstraint[] {
    if (origem === 'totem') return [where(campoMatricula, '==', u.matricula)]
    if (u.perfil === 'admin') return []
    if (u.perfil === 'gestor') return [where('lotacao', '==', u.unidade)]
    return [where(campoMatricula, '==', u.matricula)]
  }

  async function consultarDocumentos(ctx: Contexto, filtros: FiltrosDocumento): Promise<Documento[]> {
    const { usuario: u, origem } = ctx
    const c = col('documentos')
    // Igualdades exatas vão para o Firestore; o restante (texto, acentos) é filtrado em memória.
    const proc =
      filtros.numeroProcesso && somenteDigitos(filtros.numeroProcesso).length === 17
        ? [where('numeroProcesso', '==', mascararProcesso(filtros.numeroProcesso))]
        : []
    const mat = filtros.matriculaServidor ? [where('matriculaServidor', '==', filtros.matriculaServidor)] : []
    const niveis = origem === 'totem' ? [where('nivelAcesso', 'in', NIVEIS_TOTEM)] : []
    let consultas: Query[]
    // Totem: qualquer perfil vê só os próprios documentos (nunca sigilosos).
    if (origem === 'totem') consultas = [query(c, where('matriculaServidor', '==', u.matricula), ...niveis, ...proc)]
    else if (u.perfil === 'admin') consultas = [query(c, ...niveis, ...mat, ...proc)]
    else if (u.perfil === 'gestor') consultas = [query(c, where('lotacao', '==', u.unidade), ...niveis, ...mat, ...proc)]
    else {
      // Os próprios documentos (nunca sigilosos)...
      const proprios = query(c, where('matriculaServidor', '==', u.matricula), where('nivelAcesso', 'in', NIVEIS_TOTEM), ...proc)
      // ...e os de nível público-interno (de qualquer servidor).
      const publicos = query(c, where('nivelAcesso', '==', 'publico-interno'), ...mat, ...proc)
      if (filtros.matriculaServidor === u.matricula) consultas = [proprios]
      else if (filtros.matriculaServidor) consultas = [publicos]
      else consultas = [proprios, publicos]
    }
    const snaps = await Promise.all(consultas.map((q) => getDocs(q)))
    const mapa = new Map<string, Documento>()
    snaps.forEach((s) => s.docs.forEach((d) => mapa.set(d.id, comId<Documento>(d))))
    // Defesa em profundidade: reaplica a regra no cliente.
    return [...mapa.values()].filter((d) => podeVerDocumento(u, d, origem))
  }

  return {
    nome: 'firebase',

    auth: {
      entrar: (matricula, senha) =>
        protegido(async () => {
          const cred = await signInWithEmailAndPassword(auth, emailDaMatricula(somenteDigitos(matricula)), senha)
          const usuario = await carregarUsuario(cred.user.uid)
          if (!usuario) {
            await signOut(auth)
            throw new ErroServico('Usuário sem perfil cadastrado. Procure o RH.', 'permissao')
          }
          return usuario
        }),
      sair: () => protegido(() => signOut(auth)),
      observar(cb) {
        return onAuthStateChanged(auth, async (fbUser) => {
          if (!fbUser) return cb(null)
          try {
            cb(await carregarUsuario(fbUser.uid))
          } catch {
            cb(null)
          }
        })
      },
    },

    documentos: {
      buscar: (filtros, ctx) =>
        protegido(async () => aplicarFiltros(await consultarDocumentos(ctx, filtros), filtros)),
      obterPorId: (id, ctx) =>
        ouNulo(async () => {
          const snap = await getDoc(doc(db, 'documentos', id))
          if (!snap.exists()) return null
          const d = comId<Documento>(snap)
          return podeVerDocumento(ctx.usuario, d, ctx.origem) ? d : null
        }),
      verificarDuplicidade: (dados, _ctx, ignorarId) =>
        protegido(async () => {
          if (!somenteDigitos(dados.numeroProcesso)) return [] // sem processo (autoatendimento)
          const s = await getDocs(
            query(
              col('documentos'),
              where('numeroProcesso', '==', mascararProcesso(dados.numeroProcesso)),
              where('tipo', '==', dados.tipo),
              where('matriculaServidor', '==', dados.matriculaServidor),
            ),
          )
          return s.docs.map((d) => comId<Documento>(d)).filter((d) => d.id !== ignorarId)
        }),
      criar: (dados, ctx) =>
        protegido(async () => {
          const agora = new Date().toISOString()
          const ref = doc(col('documentos'))
          const novo: Documento = { ...dados, id: ref.id, criadoPor: ctx.usuario.uid, criadoEm: agora, atualizadoEm: agora }
          const { id: _id, ...semId } = novo
          await setDoc(ref, semId)
          return novo
        }),
      atualizar: (id, dados, _ctx) =>
        protegido(async () => {
          const ref = doc(db, 'documentos', id)
          await updateDoc(ref, { ...dados, atualizadoEm: new Date().toISOString() })
          return comId<Documento>(await getDoc(ref))
        }),
      arquivar: (id, localizacaoFisica, _ctx) =>
        protegido(async () => {
          const ref = doc(db, 'documentos', id)
          await updateDoc(ref, {
            status: 'Arquivado',
            dataArquivamento: hojeISO(),
            localizacaoFisica,
            atualizadoEm: new Date().toISOString(),
          })
          return comId<Documento>(await getDoc(ref))
        }),
    },

    servidores: {
      listar: (ctx) =>
        protegido(async () => {
          const s = await getDocs(query(col('servidores'), ...restricaoPerfil(ctx.usuario, 'matricula', ctx.origem)))
          return s.docs.map((d) => comId<Servidor>(d)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        }),
      obterPorMatricula: (matricula, ctx) =>
        ouNulo(async () => {
          const s = await getDocs(
            query(col('servidores'), where('matricula', '==', matricula), ...restricaoPerfil(ctx.usuario, 'matricula', ctx.origem), limit(1)),
          )
          return s.empty ? null : comId<Servidor>(s.docs[0])
        }),
      contagemCompetencias: (ctx) =>
        protegido(async () => {
          const ref = doc(db, 'estatisticas', 'competencias')
          if (ctx.usuario.perfil === 'admin') {
            // O RH lê todas as fichas, recalcula e publica SÓ os números agregados para os gestores.
            const todos = (await getDocs(col('servidores'))).docs.map((d) => comId<Servidor>(d))
            const contagem = Object.fromEntries(contarCompetencias(todos))
            await setDoc(ref, { contagem, atualizadoEm: new Date().toISOString() })
            return contagem
          }
          const snap = await getDoc(ref)
          return snap.exists() ? (snap.data().contagem as Record<string, number>) : {}
        }),
    },

    extratos: {
      emitir: (secoes, ctx) =>
        protegido(async () => {
          // Nome vem da PRÓPRIA ficha (as regras só deixam criar extrato da própria matrícula).
          const s = await getDocs(query(col('servidores'), where('matricula', '==', ctx.usuario.matricula), limit(1)))
          const nome = s.empty ? ctx.usuario.nome : comId<Servidor>(s.docs[0]).nome
          const extrato = novoExtrato(secoes, ctx, nome)
          // O documento é legível por quem tem o código: grava SÓ os campos de verificação.
          const { codigo, emitidoPorUid: _uid, ...dados } = extrato
          await setDoc(doc(db, 'extratos', codigo), dados)
          return extrato
        }),
      verificar: (codigo) =>
        ouNulo(async () => {
          const c = normalizarCodigo(codigo)
          if (!PADRAO_CODIGO_EXTRATO.test(c)) return null
          // Leitura pública por código exato (as regras permitem "get", nunca "list").
          const snap = await getDoc(doc(db, 'extratos', c))
          return snap.exists() ? ({ ...(snap.data() as Omit<Extrato, 'codigo'>), codigo: c } as Extrato) : null
        }),
    },

    solicitacoes: {
      listar: (f, ctx) =>
        protegido(async () => {
          const u = ctx.usuario
          const r: QueryConstraint[] =
            u.perfil === 'admin' ? [] : u.perfil === 'gestor' ? [where('lotacao', '==', u.unidade)] : [where('matriculaServidor', '==', u.matricula)]
          if (f.status) r.push(where('status', '==', f.status))
          if (f.matriculaServidor && u.perfil !== 'servidor') r.push(where('matriculaServidor', '==', f.matriculaServidor))
          const s = await getDocs(query(col('solicitacoes'), ...r))
          return s.docs.map((d) => comId<Solicitacao>(d)).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
        }),
      criar: (dados, ctx) =>
        protegido(async () => {
          validarSolicitacao(dados)
          const u = ctx.usuario
          const nova: Omit<Solicitacao, 'id'> = {
            ...dados,
            matriculaServidor: u.matricula,
            nomeServidor: u.nome,
            lotacao: u.unidade,
            status: 'pendente',
            criadaEm: new Date().toISOString(),
            criadaPorUid: u.uid,
            origem: ctx.origem,
          }
          const ref = await addDoc(col('solicitacoes'), nova)
          return { ...nova, id: ref.id }
        }),
      decidir: (id, decisao, motivoRecusa, ctx) =>
        protegido(async () => {
          const refSol = doc(db, 'solicitacoes', id)
          const snap = await getDoc(refSol)
          if (!snap.exists()) throw new ErroServico('Solicitação não encontrada.', 'nao-encontrado')
          const sol = comId<Solicitacao>(snap)
          if (!podeDecidirSolicitacao(ctx.usuario, sol))
            throw new ErroServico(
              sol.matriculaServidor === ctx.usuario.matricula
                ? 'Você não pode decidir o seu próprio pedido. Ele será analisado pelo RH.'
                : 'Você não tem permissão para decidir esta solicitação.',
              'permissao',
            )
          if (decisao === 'recusada' && !motivoRecusa?.trim()) throw new ErroServico('Informe o motivo da recusa.', 'validacao')

          // Tudo num lote atômico: pedido + ficha + documento entram juntos ou nada entra.
          const lote = writeBatch(db)
          const agora = new Date().toISOString()
          if (decisao === 'aprovada') {
            const s = await getDocs(
              query(col('servidores'), where('matricula', '==', sol.matriculaServidor), ...restricaoPerfil(ctx.usuario, 'matricula', ctx.origem), limit(1)),
            )
            if (s.empty) throw new ErroServico('Ficha do servidor não encontrada.', 'nao-encontrado')
            const servidor = comId<Servidor>(s.docs[0])
            const efeito = efeitoDaAprovacao(sol, servidor)
            let documentoId: string | undefined
            if (efeito.documento) {
              const refDoc = doc(col('documentos'))
              documentoId = refDoc.id
              lote.set(refDoc, { ...efeito.documento, criadoPor: ctx.usuario.uid, criadoEm: agora, atualizadoEm: agora })
            }
            lote.update(doc(db, 'servidores', servidor.id), {
              fichaAtualizadaEm: efeito.fichaAtualizadaEm,
              // As regras conferem (getAfter) que este pedido foi aprovado no MESMO lote.
              ultimaSolicitacaoAprovada: sol.id,
              ...(efeito.capacitacao
                ? { capacitacoes: arrayUnion({ ...efeito.capacitacao, id: `cap-${servidor.matricula}-${Date.now().toString(36)}`, ...(documentoId ? { documentoId } : {}) }) }
                : {}),
            })
          }
          const decisaoDados = {
            status: decisao,
            decididaEm: agora,
            decididaPorUid: ctx.usuario.uid,
            decididaPorNome: ctx.usuario.nome,
            ...(decisao === 'recusada' ? { motivoRecusa: motivoRecusa!.trim() } : {}),
          }
          lote.update(refSol, decisaoDados)
          await lote.commit()
          return { ...sol, ...decisaoDados }
        }),
    },

    processos: {
      listar: (ctx) =>
        protegido(async () => {
          const s = await getDocs(query(col('processos'), ...restricaoPerfil(ctx.usuario, 'matriculaServidor', ctx.origem)))
          return s.docs.map((d) => comId<Processo>(d))
        }),
      obterPorId: (id, ctx) =>
        ouNulo(async () => {
          const snap = await getDoc(doc(db, 'processos', id))
          if (!snap.exists()) return null
          const p = comId<Processo>(snap)
          return podeVerProcesso(ctx.usuario, p, ctx.origem) ? p : null
        }),
      obterPorNumero: (numero, ctx) =>
        ouNulo(async () => {
          const s = await getDocs(
            query(
              col('processos'),
              where('numeroProcesso', '==', mascararProcesso(numero)),
              ...restricaoPerfil(ctx.usuario, 'matriculaServidor', ctx.origem),
              limit(1),
            ),
          )
          return s.empty ? null : comId<Processo>(s.docs[0])
        }),
      adicionarMovimentacao: (id, mov, novaSituacao) =>
        protegido(async () => {
          const ref = doc(db, 'processos', id)
          await updateDoc(ref, {
            historico: arrayUnion(mov),
            unidadeAtual: mov.unidade,
            ...(novaSituacao ? { situacao: novaSituacao } : {}),
          })
          return comId<Processo>(await getDoc(ref))
        }),
    },

    logs: {
      registrar: (log, usuario) =>
        protegido(async () => {
          await addDoc(col('logs'), {
            ...log,
            uid: usuario.uid,
            nomeUsuario: usuario.nome,
            unidade: usuario.unidade,
            data: new Date().toISOString(),
            // Carimbo do servidor: as regras exigem que seja o horário real da gravação.
            registradoEm: serverTimestamp(),
          })
        }),
      listar: (f) =>
        protegido(async () => {
          const r: QueryConstraint[] = []
          if (f.acao) r.push(where('acao', '==', f.acao))
          if (f.origem) r.push(where('origem', '==', f.origem))
          if (f.desde) r.push(where('data', '>=', f.desde))
          if (f.ate) r.push(where('data', '<=', f.ate))
          if (f.alvo) r.push(where('alvo', '==', f.alvo))
          const s = await getDocs(query(col('logs'), ...r, orderBy('data', 'desc'), limit(5000)))
          return s.docs.map((d) => {
            const { registradoEm: _r, ...resto } = d.data()
            return { ...resto, id: d.id } as LogAcesso
          })
        }),
    },

    usuarios: {
      listar: () =>
        protegido(async () => {
          const s = await getDocs(col('usuarios'))
          return s.docs.map((d) => ({ ...(d.data() as Omit<Usuario, 'uid'>), uid: d.id }))
        }),
      criar: (dados) =>
        protegido(async () => {
          const matricula = somenteDigitos(dados.matricula)
          const uid = await comAppSecundario(async (authSec) => {
            const cred = await createUserWithEmailAndPassword(authSec, emailDaMatricula(matricula), dados.senha)
            await signOut(authSec)
            return cred.user.uid
          })
          const novo: Usuario = { uid, nome: dados.nome.trim(), matricula, perfil: dados.perfil, unidade: dados.unidade }
          const { uid: _u, ...semUid } = novo
          await setDoc(doc(db, 'usuarios', uid), semUid)
          return novo
        }),
      alterarPerfil: (uid, perfil) => protegido(() => updateDoc(doc(db, 'usuarios', uid), { perfil })),
    },
  }
}
