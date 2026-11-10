import { useSyncExternalStore } from 'react'

const CONSULTA = '(pointer: coarse)'

function assinar(aoMudar: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mql = window.matchMedia(CONSULTA)
  mql.addEventListener('change', aoMudar)
  return () => mql.removeEventListener('change', aoMudar)
}

const ler = () => typeof window !== 'undefined' && !!window.matchMedia?.(CONSULTA).matches

/**
 * `true` em tela de toque (tablet/totem: ponteiro "grosso"), `false` em computador com mouse.
 * Atualiza sozinho se o aparelho mudar (ex.: notebook 2 em 1 virando tablet).
 *
 * - Toque: teclado virtual visível e campos com inputMode="none" (o teclado do tablet não abre).
 * - Computador: teclado virtual escondido, teclado físico e foco automático nos campos.
 */
export function useTelaDeToque(): boolean {
  return useSyncExternalStore(assinar, ler, () => false)
}
