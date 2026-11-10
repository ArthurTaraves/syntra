import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export function TituloTotem({ titulo, subtitulo, voltarPara = '/totem/menu' }: { titulo: string; subtitulo?: ReactNode; voltarPara?: string | -1 }) {
  const navigate = useNavigate()
  return (
    <div className="mb-6 flex items-center gap-4">
      <button type="button" onClick={() => (voltarPara === -1 ? navigate(-1) : navigate(voltarPara))}
        className="flex min-h-16 shrink-0 items-center gap-2 rounded-2xl bg-white px-5 text-xl font-semibold text-marinho-900 shadow ring-1 ring-marinho-100 active:bg-marinho-50">
        <ArrowLeft className="size-7" aria-hidden /> Voltar
      </button>
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold text-marinho-900 sm:text-4xl">{titulo}</h1>
        {subtitulo && <p className="text-lg text-marinho-700">{subtitulo}</p>}
      </div>
    </div>
  )
}
