import { CalendarDays, ChevronRight, FileText, Hash, MapPin, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatarData } from '../../lib/texto'
import type { Documento } from '../../types'
import { BadgeNivel, BadgeStatus } from '../Badges'

/** Card de resultado do totem — a LOCALIZAÇÃO FÍSICA fica em destaque. */
export function CardDocumento({ doc }: { doc: Documento }) {
  return (
    <Link to={`/totem/documento/${doc.id}`}
      className="group flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-md ring-1 ring-marinho-100 transition active:scale-[0.99] active:ring-4 active:ring-destaque-500 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-marinho-600">
            <FileText className="size-5" aria-hidden /> {doc.tipo}
          </p>
          <h3 className="text-2xl font-bold leading-snug text-marinho-950">{doc.titulo}</h3>
        </div>
        <ChevronRight className="mt-2 size-10 shrink-0 text-marinho-600" aria-hidden />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg text-marinho-800">
        <span className="flex items-center gap-2"><Hash className="size-5" aria-hidden /> {doc.numeroProcesso}</span>
        <span className="flex items-center gap-2"><CalendarDays className="size-5" aria-hidden /> {formatarData(doc.dataDocumento)}</span>
        <span className="flex items-center gap-2"><User className="size-5" aria-hidden /> {doc.nomeServidor}</span>
        <BadgeStatus status={doc.status} grande />
        {doc.nivelAcesso !== 'publico-interno' && <BadgeNivel nivel={doc.nivelAcesso} grande />}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border-l-8 border-destaque-500 bg-destaque-100 px-4 py-3">
        <MapPin className="size-8 shrink-0 text-marinho-900" aria-hidden />
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-marinho-800">Localização física</p>
          <p className="text-xl font-bold text-marinho-950">{doc.localizacaoFisica}</p>
        </div>
      </div>
    </Link>
  )
}
