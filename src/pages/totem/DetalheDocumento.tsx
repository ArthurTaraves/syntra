import { Eye, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BadgeNivel, BadgeStatus } from '../../components/Badges'
import { Carregando, NenhumResultado } from '../../components/Estados'
import { LinhaDoTempo } from '../../components/LinhaDoTempo'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { VisualizadorArquivo } from '../../components/VisualizadorArquivo'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { formatarData, formatarDataHora } from '../../lib/texto'
import { servicos } from '../../services'

export default function DetalheDocumento() {
  const { id = '' } = useParams()
  const ctx = useContextoAcesso('totem')
  const [abrirArquivo, setAbrirArquivo] = useState(false)

  // obterPorId registra o LogAcesso de "visualizacao".
  const { dados, carregando } = useCarregar(async () => {
    const doc = await servicos.documentos.obterPorId(id, ctx)
    const processo = doc ? await servicos.processos.obterPorNumero(doc.numeroProcesso, ctx) : null
    return { doc, processo }
  }, [id, ctx])

  if (carregando) return <Carregando texto="Abrindo documento…" grande />
  const doc = dados?.doc
  if (!doc)
    return (
      <>
        <TituloTotem titulo="Documento" voltarPara={-1} />
        <NenhumResultado grande titulo="Documento não encontrado">
          O documento não existe ou não está disponível para o seu perfil neste totem.
        </NenhumResultado>
      </>
    )

  const visualizar = () => {
    void servicos.logs.registrar({ acao: 'download', alvo: doc.id, detalhe: doc.titulo, origem: 'totem' }, ctx.usuario)
    setAbrirArquivo(true)
  }

  const campos: [string, React.ReactNode][] = [
    ['Tipo', doc.tipo],
    ['Nº do processo', doc.numeroProcesso],
    ['Servidor', `${doc.nomeServidor} · matrícula ${doc.matriculaServidor}`],
    ['Lotação', doc.lotacao],
    ['Data do documento', formatarData(doc.dataDocumento)],
    ['Data de arquivamento', formatarData(doc.dataArquivamento)],
    ['Status', <BadgeStatus key="s" status={doc.status} grande />],
    ['Nível de acesso', <BadgeNivel key="n" nivel={doc.nivelAcesso} grande />],
    ['Palavras-chave', doc.palavrasChave.join(', ')],
    ['Última atualização', formatarDataHora(doc.atualizadoEm)],
  ]

  return (
    <>
      <TituloTotem titulo={doc.titulo} voltarPara={-1} />

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border-l-[12px] border-destaque-500 bg-destaque-100 p-6 sm:flex-row sm:items-center">
        <MapPin className="size-14 shrink-0 text-marinho-900" aria-hidden />
        <div className="flex-1">
          <p className="text-lg font-bold uppercase tracking-wide text-marinho-800">Onde encontrar (localização física)</p>
          <p className="text-3xl font-extrabold text-marinho-950">{doc.localizacaoFisica}</p>
        </div>
        {doc.urlArquivo && (
          <button type="button" onClick={visualizar}
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-marinho-800 px-8 text-2xl font-bold text-white active:bg-marinho-700">
            <Eye className="size-8" aria-hidden /> Visualizar arquivo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 landscape:lg:grid-cols-[3fr_2fr]">
        <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100">
          <h2 className="mb-4 text-2xl font-bold text-marinho-900">Dados do documento</h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {campos.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt className="text-base font-semibold text-marinho-600">{rotulo}</dt>
                <dd className="text-xl text-marinho-950">{valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100">
          <h2 className="mb-1 text-2xl font-bold text-marinho-900">Histórico do processo</h2>
          {dados.processo ? (
            <>
              <p className="mb-5 text-lg text-marinho-700">
                {dados.processo.assunto} · situação: <strong>{dados.processo.situacao}</strong> · unidade atual:{' '}
                <strong>{dados.processo.unidadeAtual}</strong>
              </p>
              <LinhaDoTempo historico={dados.processo.historico} grande />
            </>
          ) : (
            <p className="text-lg text-marinho-700">O histórico de tramitação deste processo não está disponível para o seu perfil.</p>
          )}
        </section>
      </div>

      {abrirArquivo && doc.urlArquivo && (
        <VisualizadorArquivo url={doc.urlArquivo} titulo={doc.titulo} aoFechar={() => setAbrirArquivo(false)} grande />
      )}
    </>
  )
}
