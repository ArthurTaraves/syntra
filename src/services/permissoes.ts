import type { Documento, NivelAcesso, Origem, Perfil, Processo, Servidor, Solicitacao, Usuario } from '../types'

// Regras de perfil do app. As MESMAS regras estão em firestore.rules (servidor),
// porque o front-end nunca pode ser a única proteção.

// ORGANIZAÇÃO EM DUAS ÁREAS (docs/PROPOSTA.md):
//  - TOTEM ("Área do servidor"): QUALQUER perfil vê só o que é da PRÓPRIA matrícula
//    (gestor e RH também são policiais e consultam a própria ficha ali).
//  - PAINEL ("Site do RH"): gestor vê a própria unidade; RH vê tudo.

/** Níveis que podem aparecer no totem: sigiloso nunca é exibido lá. */
export const NIVEIS_TOTEM: NivelAcesso[] = ['publico-interno', 'restrito']

export function podeVerDocumento(usuario: Usuario, doc: Documento, origem: Origem): boolean {
  if (origem === 'totem') return doc.matriculaServidor === usuario.matricula && doc.nivelAcesso !== 'sigiloso'
  switch (usuario.perfil) {
    case 'admin':
      return true
    case 'gestor':
      return doc.lotacao === usuario.unidade
    case 'servidor':
      return (
        doc.nivelAcesso !== 'sigiloso' &&
        (doc.matriculaServidor === usuario.matricula || doc.nivelAcesso === 'publico-interno')
      )
  }
}

export function podeVerProcesso(usuario: Usuario, p: Processo, origem: Origem = 'painel'): boolean {
  if (origem === 'totem' || usuario.perfil === 'servidor') return p.matriculaServidor === usuario.matricula
  if (usuario.perfil === 'admin') return true
  return p.lotacao === usuario.unidade
}

export function podeVerServidor(usuario: Usuario, s: Servidor, origem: Origem = 'painel'): boolean {
  if (origem === 'totem') return s.matricula === usuario.matricula
  if (usuario.perfil === 'admin') return true
  if (usuario.perfil === 'gestor') return s.lotacao === usuario.unidade
  return s.matricula === usuario.matricula
}

export const podeEditarDocumentos = (u: Usuario | null) => u?.perfil === 'admin'
export const podeMovimentarProcesso = (u: Usuario, p: Processo) =>
  u.perfil === 'admin' || (u.perfil === 'gestor' && p.lotacao === u.unidade)
export const podeVerLogs = (u: Usuario | null) => u?.perfil === 'admin'
export const podeGerenciarUsuarios = (u: Usuario | null) => u?.perfil === 'admin'

/** Ver pedidos de autoatendimento: o próprio servidor, o gestor da unidade ou o RH. */
export function podeVerSolicitacao(u: Usuario, s: Solicitacao): boolean {
  if (u.perfil === 'admin') return true
  if (u.perfil === 'gestor' && s.lotacao === u.unidade) return true
  return s.matriculaServidor === u.matricula
}

/** Decidir: RH qualquer pedido; gestor só da própria unidade e NUNCA o próprio pedido. */
export function podeDecidirSolicitacao(u: Usuario, s: Solicitacao): boolean {
  if (s.status !== 'pendente') return false
  if (u.perfil === 'admin') return true
  return u.perfil === 'gestor' && s.lotacao === u.unidade && s.matriculaServidor !== u.matricula
}

/** Painel de indicadores, alertas e talentos: gestor (sua unidade) e RH. */
export const podeVerIndicadores = (u: Usuario | null) => u?.perfil === 'gestor' || u?.perfil === 'admin'

export const ROTULO_PERFIL: Record<Perfil, string> = {
  servidor: 'Servidor',
  gestor: 'Gestor de unidade',
  admin: 'RH / administrador',
}

export const ROTULO_NIVEL: Record<NivelAcesso, string> = {
  'publico-interno': 'Público interno',
  restrito: 'Restrito',
  sigiloso: 'Sigiloso',
}
