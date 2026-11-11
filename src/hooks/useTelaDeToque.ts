import { useSyncExternalStore } from 'react'

// Regra ÚNICA de teclado do site (login e qualquer campo com TecladoVirtual):
//  - "virtual"  → tela de toque GRANDE (totem/tablet: pointer coarse E largura ≥ 768 px):
//                 teclado virtual próprio visível; campos com inputMode="none".
//  - "nativo"   → celular (toque com menos de 768 px): SEM teclado virtual; teclado do
//                 próprio aparelho, inputMode normal, autocomplete e foco automático.
//  - "fisico"   → computador (mouse): teclado físico e foco automático; o teclado virtual
//                 fica escondido e pode ser mostrado pelo botão "Mostrar teclado na tela"
//                 (só em tela grande, ≥ 768 px).
export type TipoTeclado = 'virtual' | 'nativo' | 'fisico'

const TOQUE = '(pointer: coarse)'
const GRANDE = '(min-width: 768px)'

function assinar(aoMudar: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const consultas = [window.matchMedia(TOQUE), window.matchMedia(GRANDE)]
  consultas.forEach((m) => m.addEventListener('change', aoMudar))
  return () => consultas.forEach((m) => m.removeEventListener('change', aoMudar))
}

const casa = (q: string) => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches

function lerTipo(): TipoTeclado {
  if (!casa(TOQUE)) return 'fisico'
  return casa(GRANDE) ? 'virtual' : 'nativo'
}

/** Qual teclado usar neste aparelho. Atualiza sozinho (girar o tablet, redimensionar a janela…). */
export function useTecladoVirtual(): { tipo: TipoTeclado; virtual: boolean; nativo: boolean; fisico: boolean; podeMostrarBotao: boolean } {
  const tipo = useSyncExternalStore(assinar, lerTipo, () => 'fisico' as const)
  const grande = useSyncExternalStore(assinar, () => casa(GRANDE), () => true)
  return {
    tipo,
    virtual: tipo === 'virtual',
    nativo: tipo === 'nativo',
    fisico: tipo === 'fisico',
    // "Mostrar teclado na tela": só no computador com tela grande.
    podeMostrarBotao: tipo === 'fisico' && grande,
  }
}

/** `true` em qualquer tela de toque (celular, tablet ou totem). */
export function useTelaDeToque(): boolean {
  return useSyncExternalStore(assinar, () => casa(TOQUE), () => false)
}
