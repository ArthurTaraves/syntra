// ============================================================================
// REGRAS DE RH CONFIGURÁVEIS — ÚNICO arquivo a alterar para mudar os critérios.
// ============================================================================
// Os valores abaixo são ILUSTRATIVOS, para o protótipo. A regra exata de
// aposentadoria (e suas exceções: regras de transição, aposentadoria policial,
// abono de permanência etc.) deve ser definida pelo RH da PRF.

/** Regra simplificada de aposentadoria: cumpre quando atinge AMBOS os mínimos. */
export const REGRA_APOSENTADORIA = {
  /** Idade mínima, em anos. */
  idadeMinima: 55,
  /** Tempo de serviço mínimo, em anos (inclui tempo averbado). */
  tempoServicoMinimoAnos: 30,
} as const

/** Aviso exibido junto de toda previsão de aposentadoria. */
export const AVISO_ESTIMATIVA_APOSENTADORIA =
  `Estimativa por regra simplificada (idade mínima de ${REGRA_APOSENTADORIA.idadeMinima} anos e ` +
  `${REGRA_APOSENTADORIA.tempoServicoMinimoAnos} anos de serviço). Não substitui a análise oficial do RH.`

/** "Próximo da aposentadoria" = previsão dentro deste horizonte (anos). */
export const HORIZONTE_APOSENTADORIA_ANOS = 5

/** Alerta de risco por unidade (verde / amarelo / vermelho). */
export const ALERTA_RISCO = {
  /** Competência "rara": no máximo esta quantidade de pessoas a possui em toda a Superintendência. */
  raridadeMaxPessoas: 2,
  /** Amarelo a partir deste percentual da unidade com aposentadoria prevista no horizonte. */
  percentualAmarelo: 0.25,
  /** Vermelho a partir deste percentual. */
  percentualVermelho: 0.5,
} as const

/** LGPD: relatórios agregados não exibem grupos com menos pessoas que isto. */
export const GRUPO_MINIMO_PRIVACIDADE = 5

/** Ficha considerada desatualizada (destaque em amarelo) após este número de meses. */
export const MESES_FICHA_DESATUALIZADA = 12

/** Totem: saída automática por inatividade. */
export const TOTEM_INATIVIDADE_SEGUNDOS = 120
export const TOTEM_AVISO_SEGUNDOS = 15
