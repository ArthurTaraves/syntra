// Regras do extrato da ficha compartilhadas pelos provedores: código de verificação e validação.

import { SECOES_EXTRATO, type Extrato, type SecaoExtrato } from '../types'
import { ErroServico, type Contexto } from './tipos'

/** Sem letras/dígitos ambíguos (0/O, 1/I/L) para facilitar a digitação do código. */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Formato do código: SYN-XXXX-XXXX (o mesmo é validado em firestore.rules). */
export const PADRAO_CODIGO_EXTRATO = /^SYN-[A-HJ-KM-NP-Z2-9]{4}-[A-HJ-KM-NP-Z2-9]{4}$/

export function gerarCodigoExtrato(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const c = [...bytes].map((b) => ALFABETO[b % ALFABETO.length]).join('')
  return `SYN-${c.slice(0, 4)}-${c.slice(4)}`
}

/** Normaliza o que a pessoa digitou na verificação (minúsculas, espaços). */
export const normalizarCodigo = (codigo: string) => codigo.trim().toUpperCase().replace(/\s+/g, '')

/** Monta o registro de um extrato da PRÓPRIA ficha do usuário logado. */
export function novoExtrato(secoes: SecaoExtrato[], ctx: Contexto, nomeServidor: string): Extrato {
  const validas = SECOES_EXTRATO.filter((s) => secoes.includes(s))
  if (validas.length === 0) throw new ErroServico('Escolha pelo menos uma seção para imprimir.', 'validacao')
  return {
    codigo: gerarCodigoExtrato(),
    matriculaServidor: ctx.usuario.matricula,
    nomeServidor,
    emitidoEm: new Date().toISOString(),
    secoes: validas,
    emitidoPorUid: ctx.usuario.uid,
  }
}
