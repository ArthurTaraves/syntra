import { useEffect, useState } from 'react'

export function useRelogio(intervaloMs = 1000) {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setAgora(new Date()), intervaloMs)
    return () => window.clearInterval(t)
  }, [intervaloMs])
  return agora
}
