// Regras do autoatendimento compartilhadas pelos provedores (local, Firebase, SharePoint):
// validação do pedido e o que muda na ficha quando ele é aprovado.

import { hojeISO } from '../lib/texto'
import type { Capacitacao, DadosDocumento, NovaSolicitacao, Servidor, Solicitacao } from '../types'
import { ErroServico } from './tipos'

/** Valida o pedido antes de enviar (mensagens prontas para a tela). */
export function validarSolicitacao(s: NovaSolicitacao): void {
  if (s.tipo === 'capacitacao') {
    const c = s.capacitacao
    if (!c || c.nome.trim().length < 3) throw new ErroServico('Informe o nome do curso.', 'validacao')
    if (!c.instituicao.trim()) throw new ErroServico('Informe a instituição.', 'validacao')
    if (!(c.cargaHoraria > 0 && c.cargaHoraria <= 2000)) throw new ErroServico('Informe a carga horária em horas.', 'validacao')
    if (!c.dataConclusao || c.dataConclusao > hojeISO()) throw new ErroServico('Informe uma data de conclusão que não esteja no futuro.', 'validacao')
  } else {
    const d = s.documento
    if (!d || d.titulo.trim().length < 3) throw new ErroServico('Informe o título do documento.', 'validacao')
  }
}

export interface EfeitoAprovacao {
  /** Documento a criar no acervo (comprovante), se houver. */
  documento: DadosDocumento | null
  /** Curso a acrescentar no bloco 4 da ficha (sem id do documento; o provedor completa). */
  capacitacao: Omit<Capacitacao, 'id' | 'documentoId'> | null
  fichaAtualizadaEm: string
}

/**
 * O que acontece na ficha ao APROVAR:
 * - curso → entra no bloco "Cursos e capacitações"; se veio arquivo, o certificado vira documento no acervo;
 * - documento → entra no acervo (sem nº de processo, nível restrito, origem "autoatendimento");
 * - em ambos, a ficha passa a "atualizada hoje".
 */
export function efeitoDaAprovacao(sol: Solicitacao, servidor: Servidor): EfeitoAprovacao {
  const hoje = hojeISO()
  const base = {
    numeroProcesso: '',
    matriculaServidor: servidor.matricula,
    nomeServidor: servidor.nome,
    lotacao: servidor.lotacao,
    dataArquivamento: null,
    status: 'Ativo' as const,
    nivelAcesso: 'restrito' as const,
    origemCadastro: 'autoatendimento' as const,
    localizacaoFisica: `Acervo digital – autoatendimento${sol.nomeArquivo ? ` (arquivo: ${sol.nomeArquivo})` : ''}`,
  }
  if (sol.tipo === 'capacitacao' && sol.capacitacao) {
    const c = sol.capacitacao
    return {
      capacitacao: c,
      documento: sol.nomeArquivo
        ? { ...base, titulo: `Certificado – ${c.nome}`, tipo: 'Capacitação', dataDocumento: c.dataConclusao, palavrasChave: ['certificado', 'capacitação', c.nome.toLowerCase()] }
        : null,
      fichaAtualizadaEm: hoje,
    }
  }
  const d = sol.documento!
  return {
    capacitacao: null,
    documento: { ...base, titulo: d.titulo, tipo: d.tipo, dataDocumento: hoje, palavrasChave: ['autoatendimento', d.tipo.toLowerCase()] },
    fichaAtualizadaEm: hoje,
  }
}
