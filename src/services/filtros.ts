import { contemTermos, somenteDigitos } from '../lib/texto'
import type { Documento } from '../types'
import type { FiltrosDocumento } from './tipos'

/**
 * Aplica os filtros de busca sobre um conjunto de documentos JÁ AUTORIZADOS.
 * A busca é tolerante: ignora acentos/maiúsculas e aceita nº de processo com ou sem pontuação.
 */
export function aplicarFiltros(docs: Documento[], f: FiltrosDocumento): Documento[] {
  const proc = f.numeroProcesso ? somenteDigitos(f.numeroProcesso) : ''
  const srv = f.servidor?.trim() ?? ''
  const srvDigitos = somenteDigitos(srv)
  const srvEhMatricula = srv !== '' && srvDigitos === srv.replace(/\s/g, '')

  return docs
    .filter((d) => {
      if (proc && !somenteDigitos(d.numeroProcesso).includes(proc)) return false
      if (srv) {
        if (srvEhMatricula ? !d.matriculaServidor.includes(srvDigitos) : !contemTermos(srv, d.nomeServidor)) return false
      }
      if (f.matriculaServidor && d.matriculaServidor !== f.matriculaServidor) return false
      if (f.tipo && d.tipo !== f.tipo) return false
      if (f.status && d.status !== f.status) return false
      if (f.lotacao && d.lotacao !== f.lotacao) return false
      if (f.nivelAcesso && d.nivelAcesso !== f.nivelAcesso) return false
      if (f.dataInicio && d.dataDocumento < f.dataInicio) return false
      if (f.dataFim && d.dataDocumento > f.dataFim) return false
      if (
        f.texto &&
        !contemTermos(
          f.texto,
          d.titulo,
          d.tipo,
          d.nomeServidor,
          d.matriculaServidor,
          d.numeroProcesso,
          d.localizacaoFisica,
          d.palavrasChave.join(' '),
        ) &&
        !(somenteDigitos(f.texto).length >= 4 && somenteDigitos(d.numeroProcesso).includes(somenteDigitos(f.texto)))
      )
        return false
      return true
    })
    .sort((a, b) => b.dataDocumento.localeCompare(a.dataDocumento))
}

/** Texto curto e legível que descreve a busca, gravado no log de consulta. */
export function descreverFiltros(f: FiltrosDocumento): string {
  const partes: string[] = []
  if (f.numeroProcesso) partes.push(`processo: ${f.numeroProcesso}`)
  if (f.servidor) partes.push(`servidor: ${f.servidor}`)
  if (f.matriculaServidor) partes.push(`matrícula: ${f.matriculaServidor}`)
  if (f.texto) partes.push(`texto: ${f.texto}`)
  if (f.tipo) partes.push(`tipo: ${f.tipo}`)
  if (f.status) partes.push(`status: ${f.status}`)
  if (f.lotacao) partes.push(`lotação: ${f.lotacao}`)
  if (f.nivelAcesso) partes.push(`nível: ${f.nivelAcesso}`)
  if (f.dataInicio || f.dataFim) partes.push(`período: ${f.dataInicio ?? '…'} a ${f.dataFim ?? '…'}`)
  return partes.length ? partes.join('; ') : 'listagem geral'
}
