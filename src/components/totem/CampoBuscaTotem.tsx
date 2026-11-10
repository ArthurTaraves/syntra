import { Keyboard, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { TecladoVirtual } from '../TecladoVirtual'

interface Props {
  rotulo: string
  valorInicial: string
  modo: 'numerico' | 'alfanumerico'
  placeholder?: string
  /** Formata o valor exibido (ex.: máscara de processo). */
  formatar?: (v: string) => string
  aoBuscar: (valor: string) => void
}

/** Campo de busca grande com teclado virtual; o teclado recolhe depois da busca. */
export function CampoBuscaTotem({ rotulo, valorInicial, modo, placeholder, formatar = (v) => v, aoBuscar }: Props) {
  const [valor, setValor] = useState(valorInicial)
  const [tecladoAberto, setTecladoAberto] = useState(!valorInicial)

  const buscar = (e?: FormEvent) => {
    e?.preventDefault()
    if (!valor.trim()) return
    setTecladoAberto(false)
    aoBuscar(valor.trim())
  }
  const atualizar = (v: string) => setValor(formatar(v))

  return (
    <form onSubmit={buscar} className="mb-8 flex flex-col gap-4">
      <label className="text-xl font-semibold text-marinho-800" htmlFor="campo-busca">{rotulo}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="campo-busca" value={valor} inputMode="none" autoComplete="off" placeholder={placeholder}
          onFocus={() => setTecladoAberto(true)} onChange={(e) => atualizar(e.target.value)}
          className="min-h-20 flex-1 rounded-2xl bg-white px-5 text-3xl tracking-wide outline-none ring-4 ring-marinho-100 focus:ring-destaque-500" />
        <div className="flex gap-3">
          {!tecladoAberto && (
            <button type="button" onClick={() => setTecladoAberto(true)}
              className="flex min-h-20 items-center gap-2 rounded-2xl bg-white px-5 text-xl font-semibold text-marinho-900 ring-2 ring-marinho-100 active:bg-marinho-50"
              aria-label="Abrir teclado">
              <Keyboard className="size-8" aria-hidden />
            </button>
          )}
          <button type="submit" disabled={!valor.trim()}
            className="flex min-h-20 flex-1 items-center justify-center gap-3 rounded-2xl bg-marinho-800 px-8 text-2xl font-bold text-white active:bg-marinho-700 disabled:opacity-40">
            <Search className="size-8" aria-hidden /> Buscar
          </button>
        </div>
      </div>
      {tecladoAberto && (
        <div className="rounded-3xl bg-marinho-50 p-4">
          <TecladoVirtual modo={modo}
            onTecla={(c) => atualizar(valor + c)}
            onApagar={() => atualizar(valor.slice(0, -1))}
            onLimpar={() => setValor('')}
            onConfirmar={() => buscar()}
            rotuloConfirmar="Buscar" />
        </div>
      )}
    </form>
  )
}
