import { Award, BadgeCheck, Briefcase, CalendarClock, Clock, FileText, MapPin, Sparkles, UserRound, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AVISO_ESTIMATIVA_APOSENTADORIA, HORIZONTE_APOSENTADORIA_ANOS } from '../../config/regrasRH'
import { calcularAposentadoria, formatarDuracao, textoAtualizacao } from '../../lib/rh'
import { formatarData, mascararCpf } from '../../lib/texto'
import type { Servidor } from '../../types'

interface Props {
  servidor: Servidor
  /** Totem: fontes e espaçamentos maiores. */
  grande?: boolean
  /** Monta o link para abrir o documento anexado a um curso (null = sem link). */
  linkDocumento?: (id: string) => string | null
  /** Competências raras na Superintendência (destaque no bloco 5). */
  competenciasRaras?: Set<string>
}

/** Selo "Ficha atualizada há X meses" (amarelo quando passa do limite configurado). */
export function SeloAtualizacao({ iso, grande }: { iso: string; grande?: boolean }) {
  const { texto, desatualizada } = textoAtualizacao(iso)
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold ring-1 ${grande ? 'px-4 py-2 text-lg' : 'px-3 py-1 text-sm'} ${
        desatualizada ? 'bg-amber-100 text-amber-950 ring-amber-400' : 'bg-emerald-100 text-emerald-950 ring-emerald-300'
      }`}
      title={`Última atualização aprovada: ${formatarData(iso)}`}>
      <Clock className={grande ? 'size-5' : 'size-4'} aria-hidden />
      {texto}
      {desatualizada && ' · precisa de atualização'}
    </span>
  )
}

function Bloco({ numero, titulo, Icone, grande, children }: { numero: number; titulo: string; Icone: LucideIcon; grande?: boolean; children: ReactNode }) {
  return (
    <section className={`break-inside-avoid rounded-2xl bg-white shadow-sm ring-1 ring-marinho-100 ${grande ? 'p-6' : 'p-5'}`} aria-labelledby={`bloco-${numero}`}>
      <h2 id={`bloco-${numero}`} className={`mb-4 flex items-center gap-3 font-bold text-marinho-900 ${grande ? 'text-2xl' : 'text-base'}`}>
        <span className={`flex shrink-0 items-center justify-center rounded-lg bg-marinho-900 text-destaque-500 ${grande ? 'size-11' : 'size-8'}`}>
          <Icone className={grande ? 'size-6' : 'size-4'} aria-hidden />
        </span>
        <span>
          <span className="sr-only">Bloco {numero}: </span>
          {titulo}
        </span>
      </h2>
      {children}
    </section>
  )
}

function Campos({ itens, grande }: { itens: [string, ReactNode][]; grande?: boolean }) {
  return (
    <dl className={`grid grid-cols-1 gap-x-6 sm:grid-cols-2 ${grande ? 'gap-y-4' : 'gap-y-3'}`}>
      {itens.map(([r, v]) => (
        <div key={r}>
          <dt className={`font-semibold text-marinho-600 ${grande ? 'text-base' : 'text-xs'}`}>{r}</dt>
          <dd className={`text-marinho-950 ${grande ? 'text-xl' : 'text-sm'}`}>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Ficha do servidor com os 5 blocos da proposta (docs/PROPOSTA.md). */
export function FichaBlocos({ servidor: s, grande, linkDocumento, competenciasRaras }: Props) {
  const ap = calcularAposentadoria(s)
  const txt = grande ? 'text-lg' : 'text-sm'
  const chip = grande ? 'px-4 py-2 text-lg' : 'px-3 py-1 text-sm'
  const historico = [...s.historicoLotacoes].sort((a, b) => b.inicio.localeCompare(a.inicio))

  return (
    <div className={`grid grid-cols-1 gap-5 ${grande ? 'landscape:xl:grid-cols-2' : 'xl:grid-cols-2'}`}>
      {/* 1. Dados básicos */}
      <Bloco numero={1} titulo="Dados básicos" Icone={UserRound} grande={grande}>
        <Campos grande={grande} itens={[
          ['Nome', s.nome],
          ['Matrícula', s.matricula],
          ['Cargo', s.cargo],
          ['Situação funcional', <span key="s" className="capitalize">{s.situacao}</span>],
          ['E-mail institucional', s.email],
          ['CPF', mascararCpf(s.cpfMascarado)],
        ]} />
      </Bloco>

      {/* 2. Lotação e movimentações */}
      <Bloco numero={2} titulo="Lotação e movimentações" Icone={MapPin} grande={grande}>
        <p className={`mb-4 ${txt}`}>
          Unidade atual: <strong className="text-marinho-950">{s.lotacao}</strong>
        </p>
        <ol className="relative ml-2 border-l-4 border-marinho-100">
          {historico.map((h, i) => (
            <li key={`${h.unidade}-${h.inicio}`} className={`relative pl-5 ${grande ? 'pb-5' : 'pb-4'} last:pb-0`}>
              <span className={`absolute -left-[0.7rem] top-1 block size-4 rounded-full border-4 border-white ${i === 0 ? 'bg-destaque-500' : 'bg-marinho-600'}`} aria-hidden />
              <p className={`font-semibold text-marinho-950 ${txt}`}>{h.unidade}</p>
              <p className={`text-marinho-700 ${grande ? 'text-base' : 'text-xs'}`}>
                {formatarData(h.inicio)} – {h.fim ? formatarData(h.fim) : 'atual'} · {h.motivo}
              </p>
            </li>
          ))}
        </ol>
      </Bloco>

      {/* 3. Tempo de serviço e aposentadoria */}
      <Bloco numero={3} titulo="Tempo de serviço e aposentadoria" Icone={CalendarClock} grande={grande}>
        <Campos grande={grande} itens={[
          ['Data de ingresso', formatarData(s.dataIngresso)],
          ['Tempo de casa', formatarDuracao(ap.anosDeCasa)],
          ['Tempo de serviço total', `${formatarDuracao(ap.anosServico)}${s.tempoAverbadoAnos ? ` (inclui ${s.tempoAverbadoAnos} anos averbados)` : ''}`],
          ['Idade', `${ap.idade} anos`],
        ]} />
        <div className={`mt-4 rounded-xl border-l-8 p-4 ${ap.proxima ? 'border-amber-500 bg-amber-50' : 'border-marinho-600 bg-marinho-50'}`}>
          <p className={`font-semibold text-marinho-800 ${grande ? 'text-base' : 'text-xs'}`}>Previsão de aposentadoria</p>
          <p className={`font-bold text-marinho-950 ${grande ? 'text-2xl' : 'text-lg'}`}>
            {ap.jaCumpre ? 'Já cumpre os requisitos' : formatarData(ap.dataPrevista)}
          </p>
          <p className={`text-marinho-800 ${txt}`}>
            {ap.jaCumpre
              ? `Requisitos atingidos em ${formatarData(ap.dataPrevista)}.`
              : `Faltam cerca de ${formatarDuracao(ap.anosRestantes)}${ap.proxima ? ` — dentro do horizonte de ${HORIZONTE_APOSENTADORIA_ANOS} anos` : ''}.`}
          </p>
          <p className={`mt-2 text-marinho-700 ${grande ? 'text-sm' : 'text-xs'}`}>⚠️ {AVISO_ESTIMATIVA_APOSENTADORIA}</p>
        </div>
      </Bloco>

      {/* 4. Cursos e capacitações */}
      <Bloco numero={4} titulo={`Cursos e capacitações (${s.capacitacoes.length})`} Icone={Award} grande={grande}>
        {s.capacitacoes.length === 0 ? (
          <p className={`text-marinho-700 ${txt}`}>Nenhum curso registrado.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {[...s.capacitacoes].sort((a, b) => b.dataConclusao.localeCompare(a.dataConclusao)).map((c) => {
              const link = c.documentoId && linkDocumento ? linkDocumento(c.documentoId) : null
              return (
                <li key={c.id} className="rounded-xl bg-fundo p-3">
                  <p className={`font-semibold text-marinho-950 ${txt}`}>{c.nome}</p>
                  <p className={`text-marinho-700 ${grande ? 'text-base' : 'text-xs'}`}>
                    {c.area} · {c.cargaHoraria} h · {c.instituicao} · concluído em {formatarData(c.dataConclusao)}
                  </p>
                  <p className={`mt-1 flex items-center gap-1.5 ${grande ? 'text-base' : 'text-xs'}`}>
                    {c.documentoId ? (
                      link ? (
                        <Link to={link} className="inline-flex items-center gap-1.5 font-semibold text-marinho-800 underline-offset-2 hover:underline">
                          <FileText className="size-4" aria-hidden /> Ver certificado anexado
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-800"><BadgeCheck className="size-4" aria-hidden /> Certificado anexado no acervo</span>
                      )
                    ) : (
                      <span className="text-marinho-600">Sem documento anexado</span>
                    )}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Bloco>

      {/* 5. Perfil e talentos */}
      <Bloco numero={5} titulo="Perfil e talentos" Icone={Sparkles} grande={grande}>
        <p className={`mb-2 font-semibold text-marinho-800 ${grande ? 'text-base' : 'text-xs'}`}>Competências</p>
        <ul className="mb-4 flex flex-wrap gap-2">
          {s.competencias.map((c) => {
            const rara = competenciasRaras?.has(c)
            return (
              <li key={c} className={`rounded-full ring-1 ${chip} ${rara ? 'bg-destaque-100 font-semibold text-marinho-950 ring-destaque-500' : 'bg-marinho-50 text-marinho-900 ring-marinho-100'}`}>
                {c}
                {rara && <span className="ml-1 text-xs font-bold uppercase">· rara</span>}
              </li>
            )
          })}
        </ul>
        <p className={`mb-2 font-semibold text-marinho-800 ${grande ? 'text-base' : 'text-xs'}`}>Indicações para oportunidades</p>
        {s.indicacoes.length ? (
          <ul className="flex flex-wrap gap-2">
            {s.indicacoes.map((i) => (
              <li key={i} className={`inline-flex items-center gap-1.5 rounded-full bg-marinho-800 text-white ${chip}`}>
                <Briefcase className="size-4" aria-hidden /> {i}
              </li>
            ))}
          </ul>
        ) : (
          <p className={`text-marinho-700 ${txt}`}>Nenhuma indicação registrada.</p>
        )}
      </Bloco>
    </div>
  )
}
