import { useCallback, useEffect, useRef, useState } from 'react'

// Teclado físico: "keydown" (qualquer tecla) e "input" (colar, preenchimento automático)
// também contam como interação.
const EVENTOS = ['pointerdown', 'keydown', 'input', 'touchstart', 'wheel', 'scroll'] as const

/**
 * Detecta inatividade. Retorna os segundos restantes quando faltam `avisoSegundos` ou menos
 * (para exibir a contagem regressiva) e chama `aoExpirar` quando o tempo acaba.
 */
export function useInatividade({
  ativo,
  limiteSegundos = 60,
  avisoSegundos = 10,
  aoExpirar,
}: {
  ativo: boolean
  limiteSegundos?: number
  avisoSegundos?: number
  aoExpirar: () => void
}) {
  const ultimaAtividade = useRef(Date.now())
  const [restante, setRestante] = useState<number | null>(null)
  const aoExpirarRef = useRef(aoExpirar)
  useEffect(() => {
    aoExpirarRef.current = aoExpirar
  })

  const reiniciar = useCallback(() => {
    ultimaAtividade.current = Date.now()
    setRestante(null)
  }, [])

  useEffect(() => {
    if (!ativo) {
      setRestante(null)
      return
    }
    reiniciar()
    const marcar = () => {
      ultimaAtividade.current = Date.now()
    }
    EVENTOS.forEach((ev) => window.addEventListener(ev, marcar, { passive: true, capture: true }))
    const timer = window.setInterval(() => {
      const passados = (Date.now() - ultimaAtividade.current) / 1000
      const faltam = Math.ceil(limiteSegundos - passados)
      if (faltam <= 0) {
        setRestante(null)
        ultimaAtividade.current = Date.now()
        aoExpirarRef.current()
      } else {
        setRestante(faltam <= avisoSegundos ? faltam : null)
      }
    }, 250)
    return () => {
      EVENTOS.forEach((ev) => window.removeEventListener(ev, marcar, { capture: true }))
      window.clearInterval(timer)
    }
  }, [ativo, limiteSegundos, avisoSegundos, reiniciar])

  return { restante, reiniciar }
}
