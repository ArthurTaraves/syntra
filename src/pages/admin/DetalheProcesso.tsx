import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeSituacao, BadgeStatus } from '../../components/Badges'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { LinhaDoTempo } from '../../components/LinhaDoTempo'
import { Aviso, Botao, CabecalhoPagina, Campo, Cartao, Entrada, Selecao } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { mensagemDeErro, useCarregar } from '../../hooks/useCarregar'
import { formatarData, hojeISO } from '../../lib/texto'
import { podeMovimentarProcesso, servicos } from '../../services'
import { SITUACOES_PROCESSO, type SituacaoProcesso } from '../../types'

export default function DetalheProcesso() {
  const { id = '' } = useParams()
  const ctx = useContextoAcesso('painel')
  const { dados, carregando, erro, setDados } = useCarregar(async () => {
    const processo = await servicos.processos.obterPorId(id, ctx)
    const documentos = processo
      ? await servicos.documentos.buscar({ numeroProcesso: processo.numeroProcesso }, ctx, { registrar: false })
      : []
    return { processo, documentos }
  }, [id, ctx])

  const [mov, setMov] = useState({ data: hojeISO(), unidade: '', descricao: '' })
  const [novaSituacao, setNovaSituacao] = useState<SituacaoProcesso | ''>('')
  const [msg, setMsg] = useState<{ tipo: 'alerta' | 'sucesso'; texto: string } | null>(null)
  const [salvando, setSalvando] = useState(false)

  if (carregando) return <Carregando />
  if (erro) return <MensagemErro>{erro}</MensagemErro>
  const p = dados?.processo
  if (!p) return <NenhumResultado titulo="Processo não encontrado">O processo não existe ou não pertence à sua unidade.</NenhumResultado>

  const adicionar = async (e: FormEvent) => {
    e.preventDefault()
    if (!mov.data || mov.unidade.trim().length < 2 || mov.descricao.trim().length < 5)
      return setMsg({ tipo: 'alerta', texto: 'Preencha a data, a unidade e uma descrição com pelo menos 5 caracteres.' })
    if (mov.data > hojeISO()) return setMsg({ tipo: 'alerta', texto: 'A data da movimentação não pode estar no futuro.' })
    setSalvando(true)
    try {
      const atualizado = await servicos.processos.adicionarMovimentacao(
        p.id,
        { data: mov.data, unidade: mov.unidade.trim(), descricao: mov.descricao.trim() },
        novaSituacao || null,
        ctx,
      )
      setDados({ processo: atualizado, documentos: dados.documentos })
      setMov({ data: hojeISO(), unidade: '', descricao: '' })
      setNovaSituacao('')
      setMsg({ tipo: 'sucesso', texto: 'Movimentação registrada.' })
    } catch (err) {
      setMsg({ tipo: 'alerta', texto: mensagemDeErro(err) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <CabecalhoPagina titulo={`Processo ${p.numeroProcesso}`} descricao={p.assunto} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-6">
          <Cartao>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-xs font-semibold text-marinho-700">Servidor</dt><dd><Link className="text-marinho-800 hover:underline" to={`/admin/servidores/${p.matriculaServidor}`}>{p.nomeServidor}</Link></dd></div>
              <div><dt className="text-xs font-semibold text-marinho-700">Lotação</dt><dd>{p.lotacao}</dd></div>
              <div><dt className="text-xs font-semibold text-marinho-700">Situação</dt><dd><BadgeSituacao situacao={p.situacao} /></dd></div>
              <div><dt className="text-xs font-semibold text-marinho-700">Unidade atual</dt><dd>{p.unidadeAtual}</dd></div>
            </dl>
          </Cartao>
          <Cartao>
            <h2 className="mb-4 font-bold text-marinho-900">Linha do tempo da tramitação</h2>
            <LinhaDoTempo historico={p.historico} />
          </Cartao>
        </div>

        <div className="flex flex-col gap-6">
          {podeMovimentarProcesso(ctx.usuario) && (
            <Cartao>
              <h2 className="mb-4 font-bold text-marinho-900">Adicionar movimentação</h2>
              <form onSubmit={adicionar} className="flex flex-col gap-3" noValidate>
                <Campo rotulo="Data"><Entrada type="date" max={hojeISO()} value={mov.data} onChange={(e) => setMov({ ...mov, data: e.target.value })} /></Campo>
                <Campo rotulo="Unidade de destino"><Entrada value={mov.unidade} placeholder="Ex.: SPRF-PI/NGP" onChange={(e) => setMov({ ...mov, unidade: e.target.value })} /></Campo>
                <Campo rotulo="Descrição"><Entrada value={mov.descricao} placeholder="Ex.: Encaminhado para análise" onChange={(e) => setMov({ ...mov, descricao: e.target.value })} /></Campo>
                <Campo rotulo="Alterar situação (opcional)">
                  <Selecao value={novaSituacao} onChange={(e) => setNovaSituacao(e.target.value as SituacaoProcesso | '')}>
                    <option value="">Manter: {p.situacao}</option>
                    {SITUACOES_PROCESSO.filter((s) => s !== p.situacao).map((s) => <option key={s}>{s}</option>)}
                  </Selecao>
                </Campo>
                {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
                <Botao type="submit" disabled={salvando}><Plus className="size-4" /> {salvando ? 'Salvando…' : 'Registrar movimentação'}</Botao>
              </form>
            </Cartao>
          )}
          <Cartao>
            <h2 className="mb-3 font-bold text-marinho-900">Documentos do processo ({dados.documentos.length})</h2>
            {dados.documentos.length === 0 ? <p className="text-sm text-marinho-700">Nenhum documento visível para o seu perfil.</p> : (
              <ul className="flex flex-col gap-3">
                {dados.documentos.map((d) => (
                  <li key={d.id} className="rounded-lg bg-fundo p-3 text-sm">
                    <p className="font-semibold">{d.titulo}</p>
                    <p className="flex items-center gap-2 text-xs text-marinho-700">{formatarData(d.dataDocumento)} <BadgeStatus status={d.status} /></p>
                    <p className="text-xs text-marinho-800">📍 {d.localizacaoFisica}</p>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      </div>
    </>
  )
}
