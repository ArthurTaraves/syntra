// Ponto de entrada da camada de dados. As telas importam SOMENTE daqui.
//
// 1) Escolhe o provedor: Firebase (quando o .env está configurado), local (demonstração) ou
//    SharePoint (VITE_DATA_PROVIDER=sharepoint; hoje só um esqueleto — ver docs/SHAREPOINT.md).
// 2) Envolve o provedor com o registro automático de LogAcesso (LGPD): toda consulta,
//    visualização e edição gera log, sem depender de cada tela lembrar de registrar.

import { MSG_MATRICULA_INVALIDA, PADRAO_MATRICULA } from '../lib/texto'
import type { NovoLog, Usuario } from '../types'
import { criarProviderFirebase } from './firebase'
import { firebaseConfigurado } from './firebase/app'
import { descreverFiltros } from './filtros'
import { criarProviderLocal } from './local'
import { criarProviderSharePoint } from './sharepoint'
import { ErroServico, type Contexto, type DataProvider } from './tipos'

function comRegistroDeAcessos(p: DataProvider): DataProvider {
  const registrar = (usuario: Usuario, log: NovoLog) =>
    p.logs.registrar(log, usuario).catch((e) => console.warn('Falha ao registrar log de acesso', e))
  const log = (ctx: Contexto, log: NovoLog) => registrar(ctx.usuario, log)

  return {
    ...p,
    auth: {
      ...p.auth,
      async entrar(matricula, senha, origem) {
        // Formato inválido não chega ao provedor e não conta como tentativa errada ("validacao").
        if (!PADRAO_MATRICULA.test(matricula)) throw new ErroServico(MSG_MATRICULA_INVALIDA, 'validacao')
        const u = await p.auth.entrar(matricula, senha, origem)
        await registrar(u, { acao: 'login', alvo: u.uid, origem })
        return u
      },
      async sair(ctx) {
        // Registra ANTES de sair: depois do logout não há mais permissão para gravar.
        if (ctx) await log(ctx, { acao: 'logout', alvo: ctx.usuario.uid, origem: ctx.origem })
        await p.auth.sair(ctx)
      },
    },
    documentos: {
      ...p.documentos,
      async buscar(filtros, ctx, opcoes) {
        const r = await p.documentos.buscar(filtros, ctx, opcoes)
        if (opcoes?.registrar !== false)
          void log(ctx, { acao: 'consulta', alvo: descreverFiltros(filtros), resultados: r.length, origem: ctx.origem })
        return r
      },
      async obterPorId(id, ctx) {
        const d = await p.documentos.obterPorId(id, ctx)
        if (d) void log(ctx, { acao: 'visualizacao', alvo: d.id, detalhe: d.titulo, origem: ctx.origem })
        return d
      },
      async criar(dados, ctx) {
        const d = await p.documentos.criar(dados, ctx)
        void log(ctx, { acao: 'edicao', alvo: d.id, detalhe: `Cadastro: ${d.titulo}`, origem: ctx.origem })
        return d
      },
      async atualizar(id, dados, ctx) {
        const d = await p.documentos.atualizar(id, dados, ctx)
        void log(ctx, { acao: 'edicao', alvo: d.id, detalhe: `Alteração: ${d.titulo}`, origem: ctx.origem })
        return d
      },
      async arquivar(id, local, ctx) {
        const d = await p.documentos.arquivar(id, local, ctx)
        void log(ctx, { acao: 'edicao', alvo: d.id, detalhe: `Arquivamento: ${d.titulo}`, origem: ctx.origem })
        return d
      },
    },
    servidores: {
      ...p.servidores,
      async obterPorMatricula(matricula, ctx) {
        const s = await p.servidores.obterPorMatricula(matricula, ctx)
        // "Quem acessou esta ficha" (LGPD visível) lê exatamente estes registros.
        if (s) void log(ctx, { acao: 'visualizacao', alvo: s.id, detalhe: `Ficha: ${s.nome} (${s.matricula})`, origem: ctx.origem })
        return s
      },
    },
    extratos: {
      ...p.extratos,
      async emitir(secoes, ctx) {
        const e = await p.extratos.emitir(secoes, ctx)
        void log(ctx, {
          acao: 'impressao',
          alvo: e.codigo,
          detalhe: `Extrato da ficha (${e.secoes.length} ${e.secoes.length === 1 ? 'seção' : 'seções'})`,
          origem: ctx.origem,
        })
        return e
      },
    },
    solicitacoes: {
      ...p.solicitacoes,
      async criar(dados, ctx) {
        const s = await p.solicitacoes.criar(dados, ctx)
        const oque = s.tipo === 'capacitacao' ? `curso "${s.capacitacao?.nome}"` : `documento "${s.documento?.titulo}"`
        void log(ctx, { acao: 'edicao', alvo: s.id, detalhe: `Autoatendimento: envio de ${oque}`, origem: ctx.origem })
        return s
      },
      async decidir(id, decisao, motivo, ctx) {
        const s = await p.solicitacoes.decidir(id, decisao, motivo, ctx)
        void log(ctx, {
          acao: 'edicao',
          alvo: s.id,
          detalhe: `Autoatendimento: pedido de ${s.nomeServidor} (${s.matriculaServidor}) ${decisao === 'aprovada' ? 'aprovado' : 'recusado'}`,
          origem: ctx.origem,
        })
        return s
      },
    },
    processos: {
      ...p.processos,
      async obterPorId(id, ctx) {
        const pr = await p.processos.obterPorId(id, ctx)
        if (pr) void log(ctx, { acao: 'visualizacao', alvo: pr.id, detalhe: `Processo ${pr.numeroProcesso}`, origem: ctx.origem })
        return pr
      },
      async adicionarMovimentacao(id, mov, situacao, ctx) {
        const pr = await p.processos.adicionarMovimentacao(id, mov, situacao, ctx)
        void log(ctx, { acao: 'edicao', alvo: pr.id, detalhe: `Movimentação: ${mov.descricao}`, origem: ctx.origem })
        return pr
      },
    },
    usuarios: {
      ...p.usuarios,
      async criar(dados, ctx) {
        if (!PADRAO_MATRICULA.test(dados.matricula)) throw new ErroServico(MSG_MATRICULA_INVALIDA, 'validacao')
        const u = await p.usuarios.criar(dados, ctx)
        void log(ctx, { acao: 'edicao', alvo: u.uid, detalhe: `Usuário criado: ${u.nome} (${u.perfil})`, origem: ctx.origem })
        return u
      },
      async alterarPerfil(uid, perfil, ctx) {
        await p.usuarios.alterarPerfil(uid, perfil, ctx)
        void log(ctx, { acao: 'edicao', alvo: uid, detalhe: `Perfil alterado para ${perfil}`, origem: ctx.origem })
      },
    },
  }
}

const escolha = import.meta.env.VITE_DATA_PROVIDER || (firebaseConfigurado ? 'firebase' : 'local')

function criarProvider(): DataProvider {
  switch (escolha) {
    case 'firebase':
      return criarProviderFirebase()
    case 'sharepoint':
      return criarProviderSharePoint()
    default:
      return criarProviderLocal()
  }
}

export const servicos: DataProvider = comRegistroDeAcessos(criarProvider())

export const modoDemonstracao = servicos.nome === 'local'

/** SharePoint escolhido mas ainda não implementado: o App mostra a tela "integração prevista". */
export const integracaoSharePointPendente = servicos.nome === 'sharepoint'

export { restaurarDadosDemonstracao } from './local'
export { aplicarFiltros, descreverFiltros } from './filtros'
export * from './permissoes'
export * from './tipos'
