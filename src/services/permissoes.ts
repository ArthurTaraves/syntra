import type { Documento, NivelAcesso, Origem, Perfil, Processo, Servidor, Solicitacao, Usuario } from '../types'

// Regras de perfil do app. As MESMAS regras estão em firestore.rules (servidor),
// porque o front-end nunca pode ser a única proteção.
//
// UM ÚNICO SITE (totem e computador), DOIS níveis de acesso pela matrícula:
//  - Policial (perfil "servidor"): só o que é da PRÓPRIA matrícula, em qualquer aparelho.
//  - RH / Gestão (perfil "admin"): tudo, de todas as unidades.
// Totem: documentos "sigiloso" nunca aparecem lá, para nenhum perfil.

/** Níveis que podem aparecer no totem: sigiloso nunca é exibido lá. */
export const NIVEIS_TOTEM: NivelAcesso[] = ['publico-interno', 'restrito']

/** RH / Gestão: acesso total (painel, fichas de todos, aprovação de pedidos). */
export const ehGestao = (u: Usuario | null | undefined): boolean => u?.perfil === 'admin'

export function podeVerDocumento(usuario: Usuario, doc: Documento, origem: Origem): boolean {
  if (doc.nivelAcesso === 'sigiloso' && (origem === 'totem' || !ehGestao(usuario))) return false
  return ehGestao(usuario) || doc.matriculaServidor === usuario.matricula
}

export const podeVerProcesso = (usuario: Usuario, p: Processo): boolean =>
  ehGestao(usuario) || p.matriculaServidor === usuario.matricula

export const podeVerServidor = (usuario: Usuario, s: Servidor): boolean =>
  ehGestao(usuario) || s.matricula === usuario.matricula

export const podeEditarDocumentos = (u: Usuario | null) => ehGestao(u)
export const podeMovimentarProcesso = (u: Usuario) => ehGestao(u)
export const podeVerLogs = (u: Usuario | null) => ehGestao(u)
export const podeGerenciarUsuarios = (u: Usuario | null) => ehGestao(u)

/** Ver pedidos de autoatendimento: o próprio servidor ou o RH / Gestão. */
export const podeVerSolicitacao = (u: Usuario, s: Solicitacao): boolean =>
  ehGestao(u) || s.matriculaServidor === u.matricula

/** Decidir: RH / Gestão, só pedidos pendentes e NUNCA o próprio pedido. */
export const podeDecidirSolicitacao = (u: Usuario, s: Solicitacao): boolean =>
  s.status === 'pendente' && ehGestao(u) && s.matriculaServidor !== u.matricula

/** Mensagem para quem tenta decidir o próprio pedido. */
export const MSG_PROPRIO_PEDIDO = 'Você não pode decidir o seu próprio pedido. Ele será analisado por outra pessoa do RH / Gestão.'

/** Painel de indicadores, alertas e talentos: só RH / Gestão. */
export const podeVerIndicadores = (u: Usuario | null) => ehGestao(u)

export const ROTULO_PERFIL: Record<Perfil, string> = {
  servidor: 'Policial',
  admin: 'RH / Gestão',
}

export const ROTULO_NIVEL: Record<NivelAcesso, string> = {
  'publico-interno': 'Público interno',
  restrito: 'Restrito',
  sigiloso: 'Sigiloso',
}
