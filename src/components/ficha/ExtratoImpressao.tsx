import qrcode from 'qrcode-generator'
import { useMemo, type ReactNode } from 'react'
import { AVISO_ESTIMATIVA_APOSENTADORIA } from '../../config/regrasRH'
import { calcularAposentadoria, formatarDuracao } from '../../lib/rh'
import { formatarData, formatarDataHora } from '../../lib/texto'
import { ROTULO_SECAO_EXTRATO, type Extrato, type Servidor } from '../../types'

/** Endereço público de verificação de um extrato. */
export const urlVerificacao = (codigo: string) => `${window.location.origin}/verificar/${codigo}`

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid border-t border-gray-300 pt-3">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-900">{titulo}</h2>
      {children}
    </section>
  )
}

const tabela = 'w-full text-left text-[11pt] [&_td]:border-b [&_td]:border-gray-200 [&_td]:py-1 [&_td]:pr-3 [&_th]:pb-1 [&_th]:pr-3 [&_th]:text-[9pt] [&_th]:uppercase [&_th]:text-gray-600'

/**
 * Extrato da ficha funcional em layout A4 (preto no branco, para impressão).
 * Nunca exibe CPF. O código e o QR levam à página pública /verificar/CODIGO.
 */
export function ExtratoImpressao({ servidor: s, extrato }: { servidor: Servidor; extrato: Extrato }) {
  const qr = useMemo(() => {
    const q = qrcode(0, 'M')
    q.addData(urlVerificacao(extrato.codigo))
    q.make()
    return q.createDataURL(4, 0)
  }, [extrato.codigo])
  const tem = (secao: Extrato['secoes'][number]) => extrato.secoes.includes(secao)
  const ap = calcularAposentadoria(s)

  return (
    <article className="extrato mx-auto flex w-full max-w-[210mm] flex-col gap-4 bg-white p-[12mm] text-[11pt] leading-snug text-gray-950 shadow-xl ring-1 ring-gray-300 print:max-w-none print:p-0 print:shadow-none print:ring-0">
      <header className="flex items-start justify-between gap-6 border-b-2 border-gray-900 pb-3">
        <div>
          <p className="text-[9pt] font-semibold uppercase tracking-wider text-gray-700">PRF-PI · Gestão de Pessoas</p>
          <h1 className="text-xl font-extrabold">Extrato da ficha funcional</h1>
          <p className="mt-1 text-[10pt]">Emitido em {formatarDataHora(extrato.emitidoEm)}</p>
          <p className="mt-1 text-[10pt] font-semibold">Documento informativo, sem valor de declaração oficial.</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1 text-center">
          <img src={qr} alt={`QR code para verificar o extrato ${extrato.codigo}`} className="size-[28mm]" style={{ imageRendering: 'pixelated' }} />
          <p className="font-mono text-[11pt] font-bold tracking-wider">{extrato.codigo}</p>
          <p className="max-w-[48mm] break-all text-[7.5pt] text-gray-700">Verifique em {urlVerificacao(extrato.codigo)}</p>
        </div>
      </header>

      <p className="text-[12pt]">
        <strong>{s.nome}</strong> · matrícula <strong>{s.matricula}</strong>
      </p>

      {tem('dados') && (
        <Secao titulo={ROTULO_SECAO_EXTRATO.dados}>
          <table className={tabela}><tbody>
            <tr><td className="w-1/3 text-gray-600">Cargo</td><td>{s.cargo}</td></tr>
            <tr><td className="text-gray-600">Situação funcional</td><td className="capitalize">{s.situacao}</td></tr>
            <tr><td className="text-gray-600">Lotação atual</td><td>{s.lotacao}</td></tr>
            <tr><td className="text-gray-600">E-mail institucional</td><td>{s.email}</td></tr>
          </tbody></table>
        </Secao>
      )}

      {tem('lotacao') && (
        <Secao titulo={ROTULO_SECAO_EXTRATO.lotacao}>
          <table className={tabela}>
            <thead><tr><th>Unidade</th><th>Período</th><th>Motivo</th></tr></thead>
            <tbody>
              {[...s.historicoLotacoes].sort((a, b) => b.inicio.localeCompare(a.inicio)).map((h) => (
                <tr key={`${h.unidade}-${h.inicio}`}><td>{h.unidade}</td><td>{formatarData(h.inicio)} – {h.fim ? formatarData(h.fim) : 'atual'}</td><td>{h.motivo}</td></tr>
              ))}
            </tbody>
          </table>
        </Secao>
      )}

      {tem('aposentadoria') && (
        <Secao titulo={ROTULO_SECAO_EXTRATO.aposentadoria}>
          <table className={tabela}><tbody>
            <tr><td className="w-1/3 text-gray-600">Data de ingresso</td><td>{formatarData(s.dataIngresso)}</td></tr>
            <tr><td className="text-gray-600">Tempo de casa</td><td>{formatarDuracao(ap.anosDeCasa)}</td></tr>
            <tr><td className="text-gray-600">Tempo de serviço total</td><td>{formatarDuracao(ap.anosServico)}{s.tempoAverbadoAnos ? ` (inclui ${s.tempoAverbadoAnos} anos averbados)` : ''}</td></tr>
            <tr><td className="text-gray-600">Previsão de aposentadoria</td><td>{ap.jaCumpre ? `Já cumpre os requisitos (desde ${formatarData(ap.dataPrevista)})` : formatarData(ap.dataPrevista)}</td></tr>
          </tbody></table>
          <p className="mt-1 text-[9pt] text-gray-700">{AVISO_ESTIMATIVA_APOSENTADORIA}</p>
        </Secao>
      )}

      {tem('cursos') && (
        <Secao titulo={ROTULO_SECAO_EXTRATO.cursos}>
          {s.capacitacoes.length === 0 ? <p>Nenhum curso registrado.</p> : (
            <table className={tabela}>
              <thead><tr><th>Curso</th><th>Área</th><th>Carga</th><th>Instituição</th><th>Conclusão</th></tr></thead>
              <tbody>
                {[...s.capacitacoes].sort((a, b) => b.dataConclusao.localeCompare(a.dataConclusao)).map((c) => (
                  <tr key={c.id}><td>{c.nome}</td><td>{c.area}</td><td>{c.cargaHoraria} h</td><td>{c.instituicao}</td><td>{formatarData(c.dataConclusao)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Secao>
      )}

      {tem('competencias') && (
        <Secao titulo={ROTULO_SECAO_EXTRATO.competencias}>
          <p>{s.competencias.join(' · ') || 'Nenhuma competência registrada.'}</p>
          {s.indicacoes.length > 0 && <p className="mt-1"><span className="text-gray-600">Indicações:</span> {s.indicacoes.join(' · ')}</p>}
        </Secao>
      )}

      <footer className="mt-2 border-t border-gray-300 pt-2 text-[8.5pt] text-gray-700">
        Extrato emitido pelo próprio servidor no totem SYNTRA. A autenticidade pode ser conferida pelo código {extrato.codigo}.
        Dados conforme a ficha na data da emissão. Tratamento de dados conforme a LGPD (Lei 13.709/2018).
      </footer>
    </article>
  )
}
