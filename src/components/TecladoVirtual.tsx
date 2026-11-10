import { ArrowBigUp, Check, Delete, Space } from 'lucide-react'
import { useState } from 'react'

interface Props {
  modo: 'numerico' | 'alfanumerico'
  onTecla: (caractere: string) => void
  onApagar: () => void
  onLimpar?: () => void
  onConfirmar?: () => void
  rotuloConfirmar?: string
  desabilitado?: boolean
}

const LINHAS_ALFA = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm']

/**
 * Teclado virtual próprio do totem: não depende do teclado do sistema operacional.
 * Todas as teclas têm no mínimo 64px de altura. `onMouseDown.preventDefault` mantém o
 * foco no campo de texto ativo enquanto se toca nas teclas.
 */
export function TecladoVirtual({ modo, onTecla, onApagar, onLimpar, onConfirmar, rotuloConfirmar = 'OK', desabilitado }: Props) {
  const [maiusculas, setMaiusculas] = useState(false)
  const manterFoco = (e: React.MouseEvent) => e.preventDefault()
  // Na vertical (totem 1080x1920) as teclas crescem para ~80px e a fonte aumenta.
  const base =
    'min-h-16 portrait:min-h-20 rounded-xl text-2xl portrait:text-3xl font-semibold shadow-sm transition active:scale-95 disabled:opacity-40 select-none touch-manipulation'
  const tecla = `${base} bg-white text-marinho-950 ring-1 ring-marinho-100 active:bg-marinho-50`
  const especial = `${base} bg-marinho-100 text-marinho-900 active:bg-marinho-50`

  const botaoConfirmar = onConfirmar && (
    <button type="button" onMouseDown={manterFoco} onClick={onConfirmar} disabled={desabilitado}
      className={`${base} flex items-center justify-center gap-2 bg-destaque-500 text-marinho-950 active:bg-destaque-400`}>
      <Check className="size-7" aria-hidden /> {rotuloConfirmar}
    </button>
  )
  const botaoApagar = (largura = '') => (
    <button type="button" onMouseDown={manterFoco} onClick={onApagar} disabled={desabilitado}
      className={`${especial} flex items-center justify-center ${largura}`} aria-label="Apagar">
      <Delete className="size-8 portrait:size-10" aria-hidden />
    </button>
  )
  // Shift e Apagar têm a mesma largura fixa e não encolhem.
  const larguraEspecial = 'w-20 portrait:w-24 shrink-0'

  if (modo === 'numerico') {
    return (
      <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-3 portrait:max-w-xl" role="group" aria-label="Teclado numérico">
        {'123456789'.split('').map((n) => (
          <button key={n} type="button" onMouseDown={manterFoco} onClick={() => onTecla(n)} disabled={desabilitado} className={tecla}>
            {n}
          </button>
        ))}
        {onLimpar ? (
          <button type="button" onMouseDown={manterFoco} onClick={onLimpar} disabled={desabilitado} className={`${especial} text-xl`}>
            Limpar
          </button>
        ) : (
          <span />
        )}
        <button type="button" onMouseDown={manterFoco} onClick={() => onTecla('0')} disabled={desabilitado} className={tecla}>
          0
        </button>
        {botaoApagar()}
        {botaoConfirmar && <div className="col-span-3 grid">{botaoConfirmar}</div>}
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 portrait:gap-3" role="group" aria-label="Teclado alfanumérico">
      {LINHAS_ALFA.map((linha, i) => (
        <div key={linha} className="flex justify-center gap-2">
          {i === 3 && (
            <button type="button" onMouseDown={manterFoco} onClick={() => setMaiusculas((m) => !m)} disabled={desabilitado}
              className={`${especial} flex items-center justify-center ${larguraEspecial} ${maiusculas ? 'bg-destaque-400' : ''}`}
              aria-label="Maiúsculas" aria-pressed={maiusculas}>
              <ArrowBigUp className="size-8 portrait:size-10" aria-hidden />
            </button>
          )}
          {linha.split('').map((c) => {
            const car = maiusculas ? c.toUpperCase() : c
            return (
              <button key={c} type="button" onMouseDown={manterFoco} onClick={() => onTecla(car)} disabled={desabilitado}
                className={`${tecla} w-full min-w-0 max-w-20 flex-1 portrait:max-w-24`}>
                {car}
              </button>
            )
          })}
          {i === 3 && botaoApagar(larguraEspecial)}
        </div>
      ))}
      <div className="grid grid-cols-[1fr_3fr_1.5fr] gap-2">
        {onLimpar ? (
          <button type="button" onMouseDown={manterFoco} onClick={onLimpar} disabled={desabilitado} className={`${especial} text-xl`}>
            Limpar
          </button>
        ) : (
          <span />
        )}
        <button type="button" onMouseDown={manterFoco} onClick={() => onTecla(' ')} disabled={desabilitado}
          className={`${tecla} flex items-center justify-center`} aria-label="Espaço">
          <Space className="size-8" aria-hidden />
        </button>
        {botaoConfirmar ?? <span />}
      </div>
    </div>
  )
}
