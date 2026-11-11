import { ArrowBigUp, Check, Delete, Eraser, Space } from 'lucide-react'
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
 * Teclado virtual próprio do totem/tablet (só aparece em tela de toque com 768 px ou mais;
 * a regra está em useTecladoVirtual). Não depende do teclado do sistema operacional.
 *
 * Layout robusto para qualquer largura: cada linha é uma grade de 20 colunas iguais
 * (minmax(0, 1fr)). Cada letra ocupa 2 colunas (1 tecla) e Shift/Apagar ocupam 3 (1,5 tecla),
 * então nenhuma tecla tem largura fixa que esprema as outras. `onMouseDown.preventDefault`
 * mantém o foco no campo de texto ativo enquanto se toca nas teclas.
 */
export function TecladoVirtual({ modo, onTecla, onApagar, onLimpar, onConfirmar, rotuloConfirmar = 'OK', desabilitado }: Props) {
  const [maiusculas, setMaiusculas] = useState(false)
  const manterFoco = (e: React.MouseEvent) => e.preventDefault()
  // Teclas com no mínimo 56–64 px de altura; na vertical do totem crescem para ~80 px.
  const base =
    'flex min-h-14 min-w-0 items-center justify-center rounded-xl font-semibold shadow-sm transition active:scale-95 disabled:opacity-40 select-none touch-manipulation md:min-h-16 portrait:md:min-h-20'
  const fonteLetra = 'text-xl md:text-2xl portrait:md:text-3xl'
  const tecla = `${base} ${fonteLetra} bg-white text-marinho-950 ring-1 ring-marinho-100 active:bg-marinho-50`
  const especial = `${base} bg-marinho-100 text-marinho-900 active:bg-marinho-50`
  // Rótulos de texto ("Limpar", "Entrar"): fonte menor e, em telas estreitas, só o ícone.
  const rotulo = 'hidden truncate text-lg sm:inline md:text-xl'
  const grade20 = 'grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2'

  const botaoLimpar = (classe = '') =>
    onLimpar ? (
      <button type="button" onMouseDown={manterFoco} onClick={onLimpar} disabled={desabilitado}
        className={`${especial} gap-2 px-2 ${classe}`} aria-label="Limpar">
        <Eraser className="size-6 shrink-0 md:size-7" aria-hidden /> <span className={rotulo}>Limpar</span>
      </button>
    ) : (
      <span className={classe} />
    )

  const botaoConfirmar = (classe = '') =>
    onConfirmar ? (
      <button type="button" onMouseDown={manterFoco} onClick={onConfirmar} disabled={desabilitado}
        className={`${base} gap-2 bg-destaque-500 px-2 text-marinho-950 active:bg-destaque-400 ${classe}`} aria-label={rotuloConfirmar}>
        <Check className="size-6 shrink-0 md:size-7" aria-hidden /> <span className={rotulo}>{rotuloConfirmar}</span>
      </button>
    ) : (
      <span className={classe} />
    )

  const botaoApagar = (classe = '') => (
    <button type="button" onMouseDown={manterFoco} onClick={onApagar} disabled={desabilitado}
      className={`${especial} ${classe}`} aria-label="Apagar">
      <Delete className="size-7 md:size-8 portrait:md:size-10" aria-hidden />
    </button>
  )

  if (modo === 'numerico') {
    return (
      <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-2 sm:gap-3 portrait:md:max-w-xl" role="group" aria-label="Teclado numérico">
        {'123456789'.split('').map((n) => (
          <button key={n} type="button" onMouseDown={manterFoco} onClick={() => onTecla(n)} disabled={desabilitado} className={tecla}>
            {n}
          </button>
        ))}
        {botaoLimpar()}
        <button type="button" onMouseDown={manterFoco} onClick={() => onTecla('0')} disabled={desabilitado} className={tecla}>
          0
        </button>
        {botaoApagar()}
        {onConfirmar && botaoConfirmar('col-span-3')}
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-1.5 sm:gap-2 portrait:md:gap-3" role="group" aria-label="Teclado alfanumérico">
      {LINHAS_ALFA.map((linha, i) => (
        <div key={linha} className={grade20}>
          {/* Linha "asdfghjkl" (9 teclas = 18 colunas): recuo de meia tecla de cada lado. */}
          {i === 2 && <span aria-hidden />}
          {i === 3 && (
            <button type="button" onMouseDown={manterFoco} onClick={() => setMaiusculas((m) => !m)} disabled={desabilitado}
              className={`${especial} col-span-3 ${maiusculas ? 'bg-destaque-400' : ''}`}
              aria-label="Maiúsculas" aria-pressed={maiusculas}>
              <ArrowBigUp className="size-7 md:size-8 portrait:md:size-10" aria-hidden />
            </button>
          )}
          {linha.split('').map((c) => {
            const car = maiusculas ? c.toUpperCase() : c
            return (
              <button key={c} type="button" onMouseDown={manterFoco} onClick={() => onTecla(car)} disabled={desabilitado}
                className={`${tecla} col-span-2`}>
                {car}
              </button>
            )
          })}
          {i === 3 && botaoApagar('col-span-3')}
        </div>
      ))}
      <div className={grade20}>
        {botaoLimpar('col-span-5')}
        <button type="button" onMouseDown={manterFoco} onClick={() => onTecla(' ')} disabled={desabilitado}
          className={`${tecla} col-span-9`} aria-label="Espaço">
          <Space className="size-8" aria-hidden />
        </button>
        {botaoConfirmar('col-span-6')}
      </div>
    </div>
  )
}
