import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { servicos, type FiltrosDocumento } from '../../services'
import { Carregando, MensagemErro, NenhumResultado } from '../Estados'
import { CardDocumento } from './CardDocumento'

/**
 * Executa a busca no totem (o serviço registra o LogAcesso de consulta, inclusive
 * as buscas sem resultado) e mostra os cards.
 */
export function ResultadosTotem({ filtros, dicaVazio }: { filtros: FiltrosDocumento; dicaVazio?: string }) {
  const ctx = useContextoAcesso('totem')
  const chave = JSON.stringify(filtros)
  const { dados, carregando, erro } = useCarregar(() => servicos.documentos.buscar(filtros, ctx), [chave, ctx])

  if (carregando) return <Carregando texto="Buscando documentos…" grande />
  if (erro) return <MensagemErro grande>{erro}</MensagemErro>
  if (!dados || dados.length === 0)
    return (
      <NenhumResultado grande titulo="Nenhum documento encontrado">
        <p>{dicaVazio ?? 'Confira os dados digitados e tente novamente.'}</p>
        <p className="mt-2 text-lg">
          Se o documento deveria existir, procure o setor de Gestão de Pessoas: sua busca foi registrada e ajuda a identificar
          documentos que faltam no acervo.
        </p>
      </NenhumResultado>
    )

  return (
    <section aria-live="polite">
      <p className="mb-4 text-xl font-semibold text-marinho-800">
        {dados.length} {dados.length === 1 ? 'documento encontrado' : 'documentos encontrados'}
      </p>
      <div className="grid grid-cols-1 gap-5 landscape:xl:grid-cols-2">
        {dados.map((d) => (
          <CardDocumento key={d.id} doc={d} />
        ))}
      </div>
    </section>
  )
}
