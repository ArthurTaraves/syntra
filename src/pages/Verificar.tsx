import { BadgeCheck, Search, ShieldX } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Carregando } from '../components/Estados'
import { Logo } from '../components/Logo'
import { useCarregar } from '../hooks/useCarregar'
import { formatarDataHora } from '../lib/texto'
import { modoDemonstracao, servicos } from '../services'
import { ROTULO_SECAO_EXTRATO } from '../types'

/** Página PÚBLICA (sem login): confere se um extrato da ficha foi emitido pelo SYNTRA. */
export default function Verificar() {
  const { codigo = '' } = useParams()
  const navigate = useNavigate()
  const [digitado, setDigitado] = useState(codigo)
  const { dados: extrato, carregando } = useCarregar(() => (codigo ? servicos.extratos.verificar(codigo) : Promise.resolve(null)), [codigo])

  const consultar = (e: FormEvent) => {
    e.preventDefault()
    if (digitado.trim()) navigate(`/verificar/${encodeURIComponent(digitado.trim().toUpperCase())}`)
  }

  return (
    <div className="min-h-dvh bg-fundo">
      <header className="bg-marinho-900 px-4 py-4 sm:px-8"><Logo tamanho="sm" /></header>
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-3xl font-extrabold text-marinho-900">Verificar extrato da ficha</h1>
          <p className="text-marinho-700">Digite o código impresso no extrato (ex.: SYN-7K4Q-2M9X) ou leia o QR code.</p>
        </div>
        <form onSubmit={consultar} className="flex gap-2">
          <input value={digitado} onChange={(e) => setDigitado(e.target.value)} placeholder="SYN-XXXX-XXXX" aria-label="Código de verificação"
            className="min-w-0 flex-1 rounded-xl border border-marinho-100 bg-white px-4 py-3 font-mono text-lg uppercase outline-none focus:ring-2 focus:ring-marinho-600" />
          <button type="submit" className="flex items-center gap-2 rounded-xl bg-marinho-800 px-5 font-semibold text-white hover:bg-marinho-700">
            <Search className="size-5" aria-hidden /> Verificar
          </button>
        </form>

        {codigo && (carregando ? <Carregando texto="Verificando…" /> : extrato ? (
          <section className="rounded-2xl border-l-8 border-emerald-600 bg-white p-6 shadow-sm ring-1 ring-emerald-200" aria-live="polite">
            <p className="mb-3 flex items-center gap-2 text-xl font-bold text-emerald-900">
              <BadgeCheck className="size-7" aria-hidden /> Extrato válido
            </p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-marinho-700">Servidor</dt><dd className="font-semibold">{extrato.nomeServidor}</dd></div>
              <div><dt className="text-xs font-semibold text-marinho-700">Matrícula</dt><dd>{extrato.matriculaServidor}</dd></div>
              <div><dt className="text-xs font-semibold text-marinho-700">Emitido em</dt><dd>{formatarDataHora(extrato.emitidoEm)}</dd></div>
              <div><dt className="text-xs font-semibold text-marinho-700">Código</dt><dd className="font-mono">{extrato.codigo}</dd></div>
            </dl>
            <p className="mt-4 text-xs font-semibold text-marinho-700">Seções impressas</p>
            <ul className="mt-1 list-disc pl-5">{extrato.secoes.map((s) => <li key={s}>{ROTULO_SECAO_EXTRATO[s]}</li>)}</ul>
            <p className="mt-4 text-xs text-marinho-700">
              Esta página confirma apenas que o extrato foi emitido pelo SYNTRA nessa data. Documento informativo, sem valor de declaração oficial.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border-l-8 border-red-600 bg-white p-6 ring-1 ring-red-200" role="alert">
            <p className="flex items-center gap-2 text-xl font-bold text-red-900"><ShieldX className="size-7" aria-hidden /> Extrato não encontrado</p>
            <p className="mt-2 text-marinho-800">Confira se o código foi digitado corretamente. Se o problema continuar, procure o setor de Gestão de Pessoas.</p>
          </section>
        ))}

        {modoDemonstracao && (
          <p className="rounded-lg bg-destaque-100 p-3 text-xs text-marinho-900">
            Modo demonstração: os extratos ficam guardados neste navegador, então só podem ser verificados no mesmo navegador em que foram emitidos.
          </p>
        )}
      </main>
    </div>
  )
}
