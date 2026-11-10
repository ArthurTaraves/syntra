import { useCallback, useEffect, useState, type DependencyList } from 'react'
import { ErroServico } from '../services'

/** Carrega dados assíncronos com estados de carregamento e erro (mensagem já em português). */
export function useCarregar<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)
    fn()
      .then((r) => ativo && setDados(r))
      .catch((e) => ativo && setErro(e instanceof ErroServico ? e.message : 'Não foi possível carregar os dados.'))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  return { dados, carregando, erro, recarregar, setDados }
}

export function mensagemDeErro(e: unknown): string {
  return e instanceof ErroServico ? e.message : 'Ocorreu um erro inesperado. Tente novamente.'
}
