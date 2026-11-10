import { Keyboard, Search } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTelaDeToque } from '../../hooks/useTelaDeToque'
import { BotaoMostrarTeclado } from '../BotaoMostrarTeclado'
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

/**
 * Campo de busca grande. Enter (teclado físico) ou "Buscar" fazem a busca.
 * - Toque: teclado virtual abre ao tocar no campo e recolhe depois da busca.
 * - Computador: teclado virtual escondido, foco automático no campo; pode ser mostrado por um botão.
 */
export function CampoBuscaTotem({ rotulo, valorInicial, modo, placeholder, formatar = (v) => v, aoBuscar }: Props) {
  const toque = useTelaDeToque()
  const [valor, setValor] = useState(valorInicial)
  const [tecladoAberto, setTecladoAberto] = useState(toque && !valorInicial)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toque) ref.current?.focus()
  }, [toque])

  const buscar = (e?: FormEvent) => {
    e?.preventDefault()
    if (!valor.trim()) return
    if (toque) setTecladoAberto(false)
    aoBuscar(valor.trim())
  }
  const atualizar = (v: string) => setValor(formatar(v))

  return (
    <form onSubmit={buscar} className="mb-8 flex flex-col gap-4">
      <label className="text-xl font-semibold text-marinho-800" htmlFor="campo-busca">{rotulo}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Toque: inputMode "none" impede o teclado do tablet de abrir por cima do nosso. */}
        <input ref={ref} id="campo-busca" value={valor} autoComplete="off" placeholder={placeholder} enterKeyHint="search"
          inputMode={toque ? 'none' : modo === 'numerico' ? 'numeric' : 'search'}
          onFocus={() => toque && setTecladoAberto(true)} onChange={(e) => atualizar(e.target.value)}
          className="min-h-20 flex-1 rounded-2xl bg-white px-5 text-3xl tracking-wide outline-none ring-4 ring-marinho-100 focus:ring-destaque-500" />
        <div className="flex gap-3">
          {toque && !tecladoAberto && (
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
      {!toque && <BotaoMostrarTeclado visivel={tecladoAberto} aoAlternar={() => setTecladoAberto((a) => !a)} />}
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
