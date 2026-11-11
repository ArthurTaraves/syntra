// Marca que o painel completo (/admin) foi aberto a partir do totem. Nesse caso o painel
// herda a saída automática do totem (2 minutos sem uso), porque o aparelho é de uso
// compartilhado. Guardado só na aba atual (sessionStorage), sem nenhum dado pessoal.

const CHAVE = 'syntra:painel-pelo-totem'

export function marcarPainelPeloTotem(): void {
  try {
    sessionStorage.setItem(CHAVE, '1')
  } catch {
    /* armazenamento indisponível: o painel segue sem a marca */
  }
}

export function painelAbertoPeloTotem(): boolean {
  try {
    return sessionStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}

export function limparPainelPeloTotem(): void {
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    /* ignora */
  }
}
