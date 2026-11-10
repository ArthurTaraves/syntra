import { useCallback, useEffect, useState } from 'react'

const CHAVE = 'syntra:totem:tentativas'
export const MAX_TENTATIVAS = 5
export const BLOQUEIO_SEGUNDOS = 30

interface Estado {
  falhas: number
  bloqueadoAte: number | null
}

function ler(): Estado {
  try {
    const e = JSON.parse(localStorage.getItem(CHAVE) ?? '') as Estado
    if (typeof e.falhas === 'number') return e
  } catch {
    /* sem dados */
  }
  return { falhas: 0, bloqueadoAte: null }
}
function gravar(e: Estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(e))
  } catch {
    /* armazenamento indisponível */
  }
}

/**
 * Bloqueio temporário do totem após 5 tentativas erradas seguidas (30 s).
 * Fica salvo no navegador para que recarregar a página não zere o bloqueio.
 * (O Firebase Auth também aplica sua própria limitação no servidor.)
 */
export function useBloqueioLogin() {
  const [estado, setEstado] = useState<Estado>(ler)
  const [agora, setAgora] = useState(Date.now())

  const bloqueado = estado.bloqueadoAte !== null && estado.bloqueadoAte > agora
  const segundosRestantes = bloqueado ? Math.ceil((estado.bloqueadoAte! - agora) / 1000) : 0

  useEffect(() => {
    if (!estado.bloqueadoAte) return
    const t = window.setInterval(() => {
      const n = Date.now()
      setAgora(n)
      if (estado.bloqueadoAte! <= n) {
        const novo = { falhas: 0, bloqueadoAte: null }
        gravar(novo)
        setEstado(novo)
      }
    }, 250)
    return () => window.clearInterval(t)
  }, [estado.bloqueadoAte])

  const registrarFalha = useCallback(() => {
    setEstado((e) => {
      const falhas = e.falhas + 1
      const novo: Estado =
        falhas >= MAX_TENTATIVAS ? { falhas, bloqueadoAte: Date.now() + BLOQUEIO_SEGUNDOS * 1000 } : { falhas, bloqueadoAte: null }
      gravar(novo)
      setAgora(Date.now())
      return novo
    })
  }, [])

  const registrarSucesso = useCallback(() => {
    const novo = { falhas: 0, bloqueadoAte: null }
    gravar(novo)
    setEstado(novo)
  }, [])

  return {
    bloqueado,
    segundosRestantes,
    tentativasRestantes: Math.max(0, MAX_TENTATIVAS - estado.falhas),
    falhas: estado.falhas,
    registrarFalha,
    registrarSucesso,
  }
}
