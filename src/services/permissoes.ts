import type { Documento, NivelAcesso, Origem, Perfil, Processo, Servidor, Usuario } from '../types'

// Regras de perfil do app. As MESMAS regras estão em firestore.rules (servidor),
// porque o front-end nunca pode ser a única proteção.

/** Níveis que podem aparecer no totem: sigiloso nunca é exibido lá. */
export const NIVEIS_TOTEM: NivelAcesso[] = ['publico-interno', 'restrito']

export function podeVerDocumento(usuario: Usuario, doc: Documento, origem: Origem): boolean {
  if (origem === 'totem' && doc.nivelAcesso === 'sigiloso') return false
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

export function podeVerProcesso(usuario: Usuario, p: Processo): boolean {
  if (usuario.perfil === 'admin') return true
  if (usuario.perfil === 'gestor') return p.lotacao === usuario.unidade
  return p.matriculaServidor === usuario.matricula
}

export function podeVerServidor(usuario: Usuario, s: Servidor): boolean {
  if (usuario.perfil === 'admin') return true
  if (usuario.perfil === 'gestor') return s.lotacao === usuario.unidade
  return s.matricula === usuario.matricula
}

export const podeEditarDocumentos = (u: Usuario | null) => u?.perfil === 'admin'
export const podeMovimentarProcesso = (u: Usuario, p: Processo) =>
  u.perfil === 'admin' || (u.perfil === 'gestor' && p.lotacao === u.unidade)
export const podeVerLogs = (u: Usuario | null) => u?.perfil === 'admin'
export const podeGerenciarUsuarios = (u: Usuario | null) => u?.perfil === 'admin'

export const ROTULO_PERFIL: Record<Perfil, string> = {
  servidor: 'Servidor',
  gestor: 'Gestor',
  admin: 'Administrador',
}

export const ROTULO_NIVEL: Record<NivelAcesso, string> = {
  'publico-interno': 'Público interno',
  restrito: 'Restrito',
  sigiloso: 'Sigiloso',
}
